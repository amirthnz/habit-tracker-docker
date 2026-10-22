"""
Backend test suite.

Covers:
1. Regression tests for the HabitViewSet mutation endpoints (stale
   `prefetch_related('logs')` cache bug) - now authenticated.
2. The JWT auth endpoints (register / login / me).
3. Per-user data isolation (users never see or mutate each other's data).
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Habit, HabitLog, Prize, PrizeRedemption


TEST_QUALITY_CONFIG = {
    'unit': 'steps',
    'bronze': {'value': 1000, 'label': '1,000 steps'},
    'silver': {'value': 4000, 'label': '4,000 steps'},
    'gold': {'value': 8000, 'label': '8,000 steps'},
}

REGISTER_URL = '/api/auth/register/'
LOGIN_URL = '/api/auth/login/'
ME_URL = '/api/auth/me/'
BOOTSTRAP_URL = '/api/bootstrap'
RESET_URL = '/api/reset'


def make_user(username: str, email: str, password: str = 'S3cure!Passphrase') -> User:
    return User.objects.create_user(username=username, email=email, password=password)


def make_habit(user: User, habit_id: str) -> Habit:
    return Habit.objects.create(
        user=user,
        id=habit_id,
        title='Test Habit',
        description='desc',
        category='Health',
        icon='Dumbbell',
        color='#6366f1',
        monthly_goal=10,
        quality_config=TEST_QUALITY_CONFIG,
        created_at='2026-10-20',
    )


class HabitMutationResponseTests(APITestCase):
    """Regression tests for the stale prefetch cache bug."""

    def setUp(self):
        self.user = make_user('mutation_user', 'mutation@example.com')
        self.client.force_authenticate(user=self.user)

    def test_set_quality_response_includes_new_log(self):
        """The response history must reflect the log created in this request."""
        habit = make_habit(self.user, 'habit-test-1')
        res = self.client.post(
            f'/api/habits/{habit.id}/set-quality/',
            {'date': '2026-10-20', 'quality': 'gold'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['history'].get('2026-10-20'), 'gold')
        self.assertTrue(
            HabitLog.objects.filter(habit=habit, date='2026-10-20', quality='gold').exists()
        )

    def test_set_quality_response_includes_updated_log(self):
        """Switching an existing tier must be reflected in the response."""
        habit = make_habit(self.user, 'habit-test-2')
        HabitLog.objects.create(habit=habit, date='2026-10-20', quality='bronze')
        res = self.client.post(
            f'/api/habits/{habit.id}/set-quality/',
            {'date': '2026-10-20', 'quality': 'silver'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['history'].get('2026-10-20'), 'silver')

    def test_set_quality_same_quality_toggles_off(self):
        """Re-sending the same quality deletes the log and the response shows it."""
        habit = make_habit(self.user, 'habit-test-3')
        HabitLog.objects.create(habit=habit, date='2026-10-20', quality='gold')
        res = self.client.post(
            f'/api/habits/{habit.id}/set-quality/',
            {'date': '2026-10-20', 'quality': 'gold'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertNotIn('2026-10-20', res.data['history'])
        self.assertFalse(HabitLog.objects.filter(habit=habit).exists())

    def test_toggle_date_on_and_off_response_freshness(self):
        """toggle-date responses must include/exclude the toggled date."""
        habit = make_habit(self.user, 'habit-test-4')
        res = self.client.post(
            f'/api/habits/{habit.id}/toggle-date/',
            {'date': '2026-10-20'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['history'].get('2026-10-20'), 'gold')

        res = self.client.post(
            f'/api/habits/{habit.id}/toggle-date/',
            {'date': '2026-10-20'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertNotIn('2026-10-20', res.data['history'])
        self.assertFalse(HabitLog.objects.filter(habit=habit).exists())


class RegisterTests(APITestCase):
    def test_register_success_returns_tokens_and_user(self):
        res = self.client.post(REGISTER_URL, {
            'username': 'alice',
            'email': 'alice@example.com',
            'password': 'S3cure!Passphrase',
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'alice')
        self.assertEqual(res.data['user']['email'], 'alice@example.com')
        self.assertTrue(User.objects.filter(username='alice').exists())

    def test_register_duplicate_username_rejected(self):
        make_user('bob', 'bob@example.com')
        res = self.client.post(REGISTER_URL, {
            'username': 'bob',
            'email': 'other@example.com',
            'password': 'S3cure!Passphrase',
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_register_duplicate_email_rejected(self):
        make_user('carol', 'shared@example.com')
        res = self.client.post(REGISTER_URL, {
            'username': 'carol2',
            'email': 'shared@example.com',
            'password': 'S3cure!Passphrase',
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_register_weak_password_rejected(self):
        res = self.client.post(REGISTER_URL, {
            'username': 'dave',
            'email': 'dave@example.com',
            'password': 'short',
        }, format='json')
        self.assertEqual(res.status_code, 400)


class LoginTests(APITestCase):
    def setUp(self):
        self.user = make_user('erin', 'erin@example.com')

    def test_login_with_username(self):
        res = self.client.post(LOGIN_URL, {
            'username': 'erin',
            'password': 'S3cure!Passphrase',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'erin')

    def test_login_with_email(self):
        res = self.client.post(LOGIN_URL, {
            'username': 'erin@example.com',
            'password': 'S3cure!Passphrase',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertEqual(res.data['user']['id'], self.user.id)

    def test_login_wrong_password_rejected(self):
        res = self.client.post(LOGIN_URL, {
            'username': 'erin',
            'password': 'wrong-password',
        }, format='json')
        self.assertEqual(res.status_code, 401)


class MeTests(APITestCase):
    def test_me_requires_authentication(self):
        res = self.client.get(ME_URL)
        self.assertEqual(res.status_code, 401)

    def test_me_returns_profile(self):
        user = make_user('frank', 'frank@example.com')
        self.client.force_authenticate(user=user)
        res = self.client.get(ME_URL)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['username'], 'frank')


class UnauthenticatedAccessTests(APITestCase):
    def test_bootstrap_requires_authentication(self):
        self.assertEqual(self.client.get(BOOTSTRAP_URL).status_code, 401)

    def test_habits_list_requires_authentication(self):
        self.assertEqual(self.client.get('/api/habits/').status_code, 401)


class UserDataIsolationTests(APITestCase):
    """Users must never see or mutate each other's data."""

    def setUp(self):
        self.user_a = make_user('user_a', 'a@example.com')
        self.user_b = make_user('user_b', 'b@example.com')
        self.habit_a = make_habit(self.user_a, 'habit-a')

    def test_habit_list_scoped_to_owner(self):
        self.client.force_authenticate(user=self.user_b)
        res = self.client.get('/api/habits/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual([h['id'] for h in res.data], [])

        self.client.force_authenticate(user=self.user_a)
        res = self.client.get('/api/habits/')
        self.assertEqual([h['id'] for h in res.data], ['habit-a'])

    def test_cross_user_habit_mutation_is_404(self):
        self.client.force_authenticate(user=self.user_b)
        res = self.client.post(
            f'/api/habits/{self.habit_a.id}/set-quality/',
            {'date': '2026-10-20', 'quality': 'gold'},
            format='json',
        )
        self.assertEqual(res.status_code, 404)
        self.assertFalse(HabitLog.objects.filter(habit=self.habit_a).exists())

    def test_bootstrap_scoped_to_owner(self):
        self.client.force_authenticate(user=self.user_b)
        res = self.client.get(BOOTSTRAP_URL)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['habits'], [])

    def test_wipe_is_user_scoped(self):
        PrizeRedemption.objects.create(
            user=self.user_a,
            id='redemption-a',
            prize_id='prize-a',
            prize_title='Movie Night',
            ticket_cost=5,
            redeemed_at='2026-10-20T00:00:00Z',
        )
        Prize.objects.create(
            user=self.user_a,
            id='prize-a',
            title='Movie Night',
            ticket_cost=5,
            created_at='2026-10-20',
        )
        self.client.force_authenticate(user=self.user_b)
        res = self.client.post(RESET_URL, {'mode': 'wipe'}, format='json')
        self.assertEqual(res.status_code, 200)

        # User A's data is untouched by user B's wipe.
        self.assertTrue(Habit.objects.filter(user=self.user_a, pk='habit-a').exists())
        self.assertTrue(Prize.objects.filter(user=self.user_a, pk='prize-a').exists())
        self.assertTrue(
            PrizeRedemption.objects.filter(user=self.user_a, pk='redemption-a').exists()
        )

    def test_seed_mode_is_disabled_and_never_creates_demo_data(self):
        # Demo seeding was removed: posting the legacy 'seed' payload must not
        # create any data for any user.
        self.client.force_authenticate(user=self.user_b)
        res = self.client.post(RESET_URL, {
            'mode': 'seed',
            'habits': [{
                'id': 'habit-b',
                'title': 'B Habit',
                'description': '',
                'category': 'Health',
                'icon': 'Dumbbell',
                'color': '#6366f1',
                'monthlyGoal': 10,
                'qualityConfig': TEST_QUALITY_CONFIG,
                'createdAt': '2026-10-20',
                'history': {'2026-10-19': 'gold'},
            }],
            'prizes': [{
                'id': 'prize-b',
                'title': 'B Prize',
                'description': '',
                'ticketCost': 3,
                'icon': 'Gift',
                'category': 'Treats',
                'createdAt': '2026-10-20',
            }],
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['habits'], [])
        self.assertEqual(res.data['prizes'], [])

        self.assertFalse(Habit.objects.filter(user=self.user_b, pk='habit-b').exists())
        self.assertFalse(Habit.objects.filter(user=self.user_a, pk='habit-b').exists())
        self.assertFalse(Prize.objects.filter(user=self.user_b, pk='prize-b').exists())
        self.assertFalse(Prize.objects.filter(user=self.user_a, pk='prize-b').exists())
        self.assertFalse(HabitLog.objects.filter(habit_id='habit-b').exists())