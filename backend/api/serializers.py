from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Habit, HabitLog, Prize, PrizeRedemption

class HabitSerializer(serializers.ModelSerializer):
    monthlyGoal = serializers.IntegerField(source='monthly_goal')
    qualityConfig = serializers.JSONField(source='quality_config')
    visionBadge = serializers.JSONField(source='vision_badge', required=False, allow_null=True)
    createdAt = serializers.CharField(source='created_at')
    history = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            'id', 'title', 'description', 'category', 'icon', 'color',
            'monthlyGoal', 'qualityConfig', 'history', 'createdAt', 'visionBadge'
        ]

    def get_history(self, obj):
        # Converts relational HabitLog rows into {'YYYY-MM-DD': 'gold', ...}
        return {log.date: log.quality for log in obj.logs.all()}


class PrizeSerializer(serializers.ModelSerializer):
    ticketCost = serializers.IntegerField(source='ticket_cost')
    createdAt = serializers.CharField(source='created_at')
    redeemedCount = serializers.IntegerField(source='redeemed_count', required=False, default=0)

    class Meta:
        model = Prize
        fields = ['id', 'title', 'description', 'ticketCost', 'icon', 'category', 'createdAt', 'redeemedCount']


class PrizeRedemptionSerializer(serializers.ModelSerializer):
    prizeId = serializers.CharField(source='prize_id')
    prizeTitle = serializers.CharField(source='prize_title')
    ticketCost = serializers.IntegerField(source='ticket_cost')
    redeemedAt = serializers.CharField(source='redeemed_at')

    class Meta:
        model = PrizeRedemption
        fields = ['id', 'prizeId', 'prizeTitle', 'ticketCost', 'redeemedAt']


# --- Auth serializers ---

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with that email address already exists.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allows login with either the username or the account email address."""

    def validate(self, attrs):
        identifier = attrs.get(self.username_field)
        # If the identifier looks like an email, resolve it to a username first.
        if identifier and '@' in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
            if user:
                attrs[self.username_field] = user.username
        return super().validate(attrs)