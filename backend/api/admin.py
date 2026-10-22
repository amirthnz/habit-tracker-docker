from django.contrib import admin
from django.utils.html import format_html
from .models import Habit, HabitLog, Prize, PrizeRedemption


class HabitLogInline(admin.TabularInline):
    model = HabitLog
    extra = 1
    ordering = ['-date']
    fields = ('date', 'quality')


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'category',
        'color_preview',
        'monthly_goal',
        'total_completions',
        'gold_completions',
        'created_at',
    )
    list_filter = ('category', 'created_at')
    search_fields = ('id', 'title', 'description')
    inlines = [HabitLogInline]
    fieldsets = (
        ('Core Info', {
            'fields': ('id', 'title', 'description', 'category', 'created_at')
        }),
        ('Appearance & Targets', {
            'fields': ('icon', 'color', 'monthly_goal', 'quality_config')
        }),
        ('AI Vision Badge', {
            'fields': ('vision_badge',),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Theme')
    def color_preview(self, obj):
        return format_html(
            '<span style="display:inline-block; width:14px; height:14px; '
            'border-radius:4px; background:{}; vertical-align:middle; margin-right:6px;"></span>{}',
            obj.color,
            obj.color,
        )

    @admin.display(description='Total Logs')
    def total_completions(self, obj):
        return obj.logs.count()

    @admin.display(description='Gold Days 🥇')
    def gold_completions(self, obj):
        return obj.logs.filter(quality='gold').count()


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('habit', 'date', 'quality')
    list_filter = ('quality', 'date', 'habit')
    search_fields = ('habit__title', 'date')
    ordering = ('-date',)


@admin.register(Prize)
class PrizeAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'ticket_cost', 'redeemed_count', 'created_at')
    list_filter = ('category',)
    search_fields = ('id', 'title', 'description')
    ordering = ('ticket_cost',)


@admin.register(PrizeRedemption)
class PrizeRedemptionAdmin(admin.ModelAdmin):
    list_display = ('prize_title', 'ticket_cost', 'redeemed_at', 'prize_id')
    list_filter = ('ticket_cost',)
    search_fields = ('prize_title', 'prize_id')
    ordering = ('-redeemed_at',)