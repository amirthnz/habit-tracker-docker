from django.conf import settings
from django.db import models

class Habit(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='habits',
        on_delete=models.CASCADE,
    )
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=100, default='Health')
    icon = models.CharField(max_length=100, default='Sun')
    color = models.CharField(max_length=20, default='#6366f1')
    monthly_goal = models.IntegerField(default=20)
    quality_config = models.JSONField(default=dict)
    vision_badge = models.JSONField(null=True, blank=True)
    created_at = models.CharField(max_length=20) # 'YYYY-MM-DD'

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self):
        return self.title


class HabitLog(models.Model):
    QUALITY_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
    ]
    habit = models.ForeignKey(Habit, related_name='logs', on_delete=models.CASCADE)
    date = models.CharField(max_length=10) # 'YYYY-MM-DD'
    quality = models.CharField(max_length=10, choices=QUALITY_CHOICES)

    class Meta:
        unique_together = ('habit', 'date')


class Prize(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='prizes',
        on_delete=models.CASCADE,
    )
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    ticket_cost = models.IntegerField(default=1)
    icon = models.CharField(max_length=100, default='Gift')
    category = models.CharField(max_length=100, default='Treats')
    created_at = models.CharField(max_length=20)
    redeemed_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.title} ({self.ticket_cost} tickets)"


class PrizeRedemption(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='redemptions',
        on_delete=models.CASCADE,
    )
    id = models.CharField(max_length=100, primary_key=True)
    prize_id = models.CharField(max_length=100)
    prize_title = models.CharField(max_length=255)
    ticket_cost = models.IntegerField()
    redeemed_at = models.CharField(max_length=50)