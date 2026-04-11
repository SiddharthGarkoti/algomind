from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import (TopicStat, SubmissionLog, ActivityLog,
                     PlatformProfile, PlatformStats, ContestHistory)


def get_overview(user):
    profiles = PlatformProfile.objects.filter(user=user)
    stats    = PlatformStats.objects.filter(profile__in=profiles)

    total_problems = stats.aggregate(t=Sum('problems_solved'))['t'] or 0
    total_easy     = stats.aggregate(t=Sum('easy_solved'))['t'] or 0
    total_medium   = stats.aggregate(t=Sum('medium_solved'))['t'] or 0
    total_hard     = stats.aggregate(t=Sum('hard_solved'))['t'] or 0
    total_contests = stats.aggregate(t=Sum('contests'))['t'] or 0
    avg_rating     = stats.aggregate(a=Avg('rating'))['a'] or 0
    best_rating    = max((s.rating for s in stats), default=0)

    logs = SubmissionLog.objects.filter(user=user)
    total_subs = logs.count()
    accepted   = logs.filter(verdict='AC').count()
    acceptance_rate = round((accepted / total_subs * 100), 1) if total_subs else 0
    avg_time   = logs.filter(verdict='AC').aggregate(a=Avg('time_taken_mins'))['a'] or 0

    # user level
    if total_hard > 50 and avg_rating > 1800:
        level = 'Advanced'
    elif total_medium > 50 or avg_rating > 1400:
        level = 'Intermediate'
    else:
        level = 'Beginner'

    return {
        'total_problems_solved': total_problems,
        'total_easy':            total_easy,
        'total_medium':          total_medium,
        'total_hard':            total_hard,
        'total_contests':        total_contests,
        'average_rating':        round(avg_rating),
        'best_rating':           best_rating,
        'acceptance_rate':       acceptance_rate,
        'avg_time_per_problem':  round(avg_time, 1),
        'user_level':            level,
        'platforms_connected':   profiles.count(),
    }


def get_topic_analysis(user):
    from .models import SubmissionLog

    # recalculate accuracy using real submission logs
    logs = SubmissionLog.objects.filter(user=user)

    topic_data = {}
    for log in logs:
        t = log.topic
        if not t:
            continue
        if t not in topic_data:
            topic_data[t] = {'total': 0, 'accepted': 0}
        topic_data[t]['total'] += 1
        if log.verdict == 'AC':
            topic_data[t]['accepted'] += 1

    # update TopicStat with real accuracy
    for topic_name, data in topic_data.items():
        total    = data['total']
        accepted = data['accepted']
        accuracy = round((accepted / total * 100), 1) if total else 0
        strength = (
            'strong' if accuracy >= 80 else
            'weak'   if accuracy <  50 else
            'medium'
        )
        TopicStat.objects.filter(
            user=user, topic=topic_name
        ).update(
            total_attempts=total,
            accuracy=accuracy,
            strength=strength,
        )

    topics = TopicStat.objects.filter(user=user).order_by('-accuracy')
    strong = [t for t in topics if t.strength == 'strong']
    weak   = [t for t in topics if t.strength == 'weak']
    medium = [t for t in topics if t.strength == 'medium']

    def serialize(t):
        return {
            'topic':           t.topic,
            'problems_solved': t.problems_solved,
            'accuracy':        round(t.accuracy, 1),
            'avg_time_mins':   round(t.avg_time_mins, 1),
            'strength':        t.strength,
        }

    return {
        'strong': [serialize(t) for t in strong],
        'medium': [serialize(t) for t in medium],
        'weak':   [serialize(t) for t in weak],
    }

def get_submission_analysis(user):
    logs = SubmissionLog.objects.filter(user=user)
    total = logs.count()
    if not total:
        return {}

    ac  = logs.filter(verdict='AC').count()
    wa  = logs.filter(verdict='WA').count()
    tle = logs.filter(verdict='TLE').count()
    re  = logs.filter(verdict='RE').count()
    ce  = logs.filter(verdict='CE').count()

    # thinking pattern
    avg_think  = logs.aggregate(a=Avg('time_taken_mins'))['a'] or 0
    avg_attempts = logs.values('problem_name').annotate(c=Count('id')).aggregate(a=Avg('c'))['a'] or 0
    one_shot   = logs.filter(verdict='AC', attempt_number=1).count()
    one_shot_rate = round((one_shot / ac * 100), 1) if ac else 0

    if avg_attempts < 1.5 and avg_think > 15:
        pattern = 'Thoughtful'
    elif avg_attempts > 3 and avg_think < 8:
        pattern = 'Impulsive'
    else:
        pattern = 'Balanced'

    return {
        'total_submissions': total,
        'verdicts': {
            'AC':  {'count': ac,  'percent': round(ac/total*100, 1)},
            'WA':  {'count': wa,  'percent': round(wa/total*100, 1)},
            'TLE': {'count': tle, 'percent': round(tle/total*100, 1)},
            'RE':  {'count': re,  'percent': round(re/total*100, 1)},
            'CE':  {'count': ce,  'percent': round(ce/total*100, 1)},
        },
        'thinking_pattern': {
            'pattern':        pattern,
            'avg_think_mins': round(avg_think, 1),
            'avg_attempts':   round(avg_attempts, 1),
            'one_shot_rate':  one_shot_rate,
        },
    }


def get_heatmap(user, days=182):
    since  = timezone.now().date() - timedelta(days=days)
    logs   = ActivityLog.objects.filter(user=user, date__gte=since)
    heatmap = {str(log.date): log.problems_solved for log in logs}
    return {'heatmap': heatmap, 'days': days}


def get_improvement(user):
    now    = timezone.now().date()
    p1_end = now - timedelta(days=30)
    p2_end = now - timedelta(days=60)

    logs = SubmissionLog.objects.filter(user=user)

    def period_stats(start, end):
        period = logs.filter(submitted_at__date__gte=start, submitted_at__date__lt=end)
        total  = period.count()
        ac     = period.filter(verdict='AC').count()
        return {
            'total':    total,
            'accepted': ac,
            'accuracy': round((ac/total*100), 1) if total else 0,
            'avg_time': round(period.filter(verdict='AC').aggregate(a=Avg('time_taken_mins'))['a'] or 0, 1),
        }

    current  = period_stats(p1_end, now)
    previous = period_stats(p2_end, p1_end)

    acc_diff  = round(current['accuracy'] - previous['accuracy'], 1)
    time_diff = round(current['avg_time'] - previous['avg_time'], 1)
    prob_diff = current['accepted'] - previous['accepted']

    return {
        'current_period':  current,
        'previous_period': previous,
        'changes': {
            'accuracy_change':  acc_diff,
            'time_change':      time_diff,
            'problems_change':  prob_diff,
            'trend': 'Improving' if acc_diff > 0 and prob_diff > 0 else
                     'Declining' if acc_diff < 0 and prob_diff < 0 else 'Mixed',
        },
    }


def get_ai_insights(user):
    topics = TopicStat.objects.filter(user=user)
    logs   = SubmissionLog.objects.filter(user=user)

    insights = []

    # weak topic insight
    weak = topics.filter(strength='weak').order_by('accuracy').first()
    if weak:
        insights.append(f"You struggle with {weak.topic} — only {round(weak.accuracy)}% accuracy. Focus here next.")

    # strong topic insight
    strong = topics.filter(strength='strong').order_by('-accuracy').first()
    if strong:
        insights.append(f"You perform well in {strong.topic} ({round(strong.accuracy)}% accuracy). Keep it up!")

    # TLE insight
    tle_count = logs.filter(verdict='TLE').count()
    total     = logs.count()
    if total and (tle_count / total) > 0.1:
        insights.append("Your TLE rate is high — focus on time complexity before submitting.")

    # WA insight
    wa_count = logs.filter(verdict='WA').count()
    if total and (wa_count / total) > 0.2:
        insights.append("High Wrong Answer rate — take more time to trace through edge cases before submitting.")

    # fallback
    if not insights:
        insights.append("Keep solving consistently! Connect more platforms to get deeper insights.")

    return {'insights': insights}


def get_recommendations(user):
    weak_topics = TopicStat.objects.filter(user=user, strength='weak').values_list('topic', flat=True)

    # Static recommendation map — extend with real DB later
    recommendations = {
        'DP':        [{'name': 'Climbing Stairs', 'difficulty': 'easy'}, {'name': 'House Robber', 'difficulty': 'medium'}, {'name': 'Coin Change', 'difficulty': 'medium'}],
        'Graphs':    [{'name': 'Number of Islands', 'difficulty': 'medium'}, {'name': 'Flood Fill', 'difficulty': 'easy'}],
        'Recursion': [{'name': 'Fibonacci Number', 'difficulty': 'easy'}, {'name': 'Letter Combinations', 'difficulty': 'medium'}],
        'Trees':     [{'name': 'Invert Binary Tree', 'difficulty': 'easy'}, {'name': 'Level Order Traversal', 'difficulty': 'medium'}],
    }

    result = []
    for topic in weak_topics:
        if topic in recommendations:
            for r in recommendations[topic]:
                r['topic'] = topic
                result.append(r)

    if not result:
        result = [
            {'name': 'Two Sum',            'difficulty': 'easy',   'topic': 'Arrays'},
            {'name': 'Valid Parentheses',  'difficulty': 'easy',   'topic': 'Stack'},
            {'name': 'Binary Search',      'difficulty': 'easy',   'topic': 'Binary Search'},
        ]

    return {'recommendations': result[:8]}