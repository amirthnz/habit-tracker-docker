import os
import json
import time
from datetime import date, datetime
from django.contrib.auth.models import User
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from google import genai
from google.genai import types

from .models import Habit, HabitLog, Prize, PrizeRedemption
from .serializers import (
    HabitSerializer,
    PrizeSerializer,
    PrizeRedemptionSerializer,
    RegisterSerializer,
    UserSerializer,
    EmailOrUsernameTokenObtainPairSerializer,
)

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users only ever see and mutate their own habits.
        return (
            Habit.objects.filter(user=self.request.user)
            .prefetch_related('logs')
            .order_by('created_at', 'id')
        )

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('id'):
            data['id'] = f"habit-{int(time.time() * 1000)}"
        if not data.get('createdAt'):
            data['createdAt'] = date.today().isoformat()
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        habit = serializer.save(user=self.request.user)

        # If an initial history dictionary is passed (e.g. bulk import), save logs
        history = request.data.get('history', {})
        if isinstance(history, dict):
            for date_str, quality in history.items():
                if quality in ('bronze', 'silver', 'gold'):
                    HabitLog.objects.create(habit=habit, date=date_str, quality=quality)

        return Response(self.get_serializer(habit).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='set-quality')
    def set_quality(self, request, pk=None):
        """Sets bronze/silver/gold or toggles off if same quality is sent."""
        habit = self.get_object()
        date_str = request.data.get('date')
        quality = request.data.get('quality') # 'bronze' | 'silver' | 'gold' | None

        existing = HabitLog.objects.filter(habit=habit, date=date_str).first()
        is_same_quality = existing is not None and existing.quality == quality
        if quality is None or is_same_quality:
            if existing:
                existing.delete()
        else:
            HabitLog.objects.update_or_create(
                habit=habit, date=date_str, defaults={'quality': quality}
            )

        # Re-fetch the habit so prefetch_related('logs') rebuilds its cache.
        # Serializing the original instance would return the STALE cached logs
        # (without the log we just created/updated), which the frontend then
        # uses to overwrite its optimistic update - making the UI look like
        # nothing happened until the next page refresh.
        habit = self.get_queryset().get(pk=habit.pk)
        return Response(self.get_serializer(habit).data)

    @action(detail=True, methods=['post'], url_path='toggle-date')
    def toggle_date(self, request, pk=None):
        """Quick checkmark toggle: cycles any completion -> off, or empty -> gold."""
        habit = self.get_object()
        date_str = request.data.get('date')
        existing = HabitLog.objects.filter(habit=habit, date=date_str).first()
        if existing:
            existing.delete()
        else:
            HabitLog.objects.create(habit=habit, date=date_str, quality='gold')

        # Re-fetch so the prefetch cache includes/excludes the toggled log,
        # otherwise the response contains stale history and the UI reverts.
        habit = self.get_queryset().get(pk=habit.pk)
        return Response(self.get_serializer(habit).data)


class PrizeViewSet(viewsets.ModelViewSet):
    serializer_class = PrizeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users only ever see and mutate their own prizes.
        return Prize.objects.filter(user=self.request.user).order_by('created_at', 'id')

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('id'):
            data['id'] = f"prize-{int(time.time() * 1000)}"
        if not data.get('createdAt'):
            data['createdAt'] = date.today().isoformat()
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=self.request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def redeem(self, request, pk=None):
        prize = self.get_object()
        prize.redeemed_count += 1
        prize.save()

        redemption = PrizeRedemption.objects.create(
            id=f"redemption-{int(time.time() * 1000)}",
            user=request.user,
            prize_id=prize.id,
            prize_title=prize.title,
            ticket_cost=prize.ticket_cost,
            redeemed_at=datetime.utcnow().isoformat() + 'Z'
        )
        return Response({
            'prize': PrizeSerializer(prize).data,
            'redemption': PrizeRedemptionSerializer(redemption).data
        })


def user_state_response(request):
    """Serializes the authenticated user's habits, prizes, and redemptions."""
    habits = (
        Habit.objects.filter(user=request.user)
        .prefetch_related('logs')
        .order_by('created_at', 'id')
    )
    prizes = Prize.objects.filter(user=request.user)
    redemptions = PrizeRedemption.objects.filter(user=request.user)
    return Response({
        'habits': HabitSerializer(habits, many=True).data,
        'prizes': PrizeSerializer(prizes, many=True).data,
        'redemptions': PrizeRedemptionSerializer(redemptions, many=True).data,
    })


@api_view(['GET'])
def bootstrap_state(request):
    """Single endpoint to load habits, prizes, and redemptions on app startup."""
    return user_state_response(request)


@api_view(['POST'])
def wipe_data(request):
    """Handles 'Wipe All': deletes every habit, prize, and redemption record
    belonging to the authenticated user and returns their (now empty) state."""
    # Wipe is strictly per-user: one account can never destroy another's data.
    Habit.objects.filter(user=request.user).delete()
    Prize.objects.filter(user=request.user).delete()
    PrizeRedemption.objects.filter(user=request.user).delete()

    return user_state_response(request)


# --- AI Endpoints (Ported from server.ts) ---

def get_gemini_client():
    api_key = os.environ.get('GEMINI_API_KEY')
    return genai.Client(api_key=api_key) if api_key else None

@api_view(['POST'])
def generate_badge(request):
    habit_title = request.data.get('habitTitle')
    habit_category = request.data.get('habitCategory', 'Personal Growth')
    habit_color = request.data.get('habitColor', '#6366f1')
    user_prompt = request.data.get('userPrompt', '')
    edit_instructions = request.data.get('editInstructions', '')

    if not habit_title:
        return Response({'error': 'habitTitle is required'}, status=400)

    client = get_gemini_client()
    if client:
        try:
            sys_instruct = (
                "You are an elite vector design artist and habit motivation coach. "
                "Generate valid JSON with: badgeTitle (1-3 words), slogan (4-8 words), "
                "themeColor (hex), and svgContent (clean SVG viewBox='0 0 100 100' width='100' height='100')."
            )
            prompt = f"Habit: {habit_title}\nCategory: {habit_category}\nColor: {habit_color}\nVision: {user_prompt}\nEdit: {edit_instructions}"
            res = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=sys_instruct,
                    response_mime_type='application/json',
                    temperature=0.7,
                )
            )
            parsed = json.loads(res.text or '{}')
            return Response({
                'success': True,
                'badgeTitle': parsed.get('badgeTitle', f'{habit_title} Master'),
                'slogan': parsed.get('slogan', 'Consistency turns action into identity.'),
                'themeColor': parsed.get('themeColor', habit_color),
                'svgContent': parsed.get('svgContent'),
            })
        except Exception as e:
            print("Gemini error:", e)

    fallback_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect x="5" y="5" width="90" height="90" rx="24" fill="{habit_color}" />
      <circle cx="50" cy="50" r="28" fill="#ffffff" fill-opacity="0.15" />
      <path d="M50 28 L56 42 L72 44 L60 54 L64 70 L50 61 L36 70 L40 54 L28 44 L44 42 Z" fill="#ffffff" />
    </svg>'''
    return Response({
        'success': True,
        'badgeTitle': f'{habit_title} Champion',
        'slogan': 'Every repetition builds the future.',
        'themeColor': habit_color,
        'svgContent': fallback_svg,
    })

@api_view(['POST'])
def period_coaching(request):
    summary = request.data.get('summary', {})
    client = get_gemini_client()
    if client and summary:
        try:
            prompt = (
                f"Review this habit tracker period summary for {summary.get('month')}/{summary.get('year')}: "
                f"Completions: {summary.get('totalCompletions')}/{summary.get('totalTargetGoal')} ({summary.get('overallRate')}%). "
                "Provide a 2-3 sentence motivating evaluation with 1 actionable tip. Plain text only."
            )
            res = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
            return Response({'success': True, 'insight': res.text.strip()})
        except Exception as e:
            print("Gemini error:", e)

    return Response({
        'success': True,
        'insight': f"You achieved a {summary.get('overallRate', 85)}% completion rate! Consistent small wins compound exponentially."
    })


# --- Auth endpoints ---

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ -> {access, refresh, user}"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    """POST /api/auth/login/ -> {access, refresh, user}. Accepts username OR email."""
    serializer_class = EmailOrUsernameTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            'access': serializer.validated_data['access'],
            'refresh': serializer.validated_data['refresh'],
            'user': UserSerializer(serializer.user).data,
        })


@api_view(['GET'])
def me(request):
    """GET /api/auth/me/ -> the authenticated user's profile."""
    return Response(UserSerializer(request.user).data)