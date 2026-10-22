from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from api.views import (
    HabitViewSet, PrizeViewSet, bootstrap_state,
    wipe_data, generate_badge, period_coaching,
    RegisterView, LoginView, me
)

router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'prizes', PrizeViewSet, basename='prize')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', LoginView.as_view(), name='auth_login'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', me, name='auth_me'),
    path('api/bootstrap', bootstrap_state),
    path('api/reset', wipe_data),
    path('api/generate-badge', generate_badge),
    path('api/period-coaching', period_coaching),
    path('api/', include(router.urls)),
]
