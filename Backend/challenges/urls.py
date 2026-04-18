from django.urls import path
from .views import (
    CreatePartyView, JoinPartyView, PartyDetailView, StartPartyView,
    AddQuestionView, RemoveQuestionView, ShuffleQuestionsView,
    CheckCompletionView, LeavePartyView, MyPartiesView,
    EndPartyView, ForfeitPartyView, KickMemberView, RenamePartyView,
    InviteFriendView, LeetCodeProblemLookupView, ShuffleWithFilterView,
    TopicListView, ExtensionPulseView,
)

urlpatterns = [
    path('party/create/',                                  CreatePartyView.as_view(),          name='party_create'),
    path('party/mine/',                                    MyPartiesView.as_view(),             name='party_mine'),
    path('party/<str:code>/',                              PartyDetailView.as_view(),           name='party_detail'),
    path('party/<str:code>/join/',                         JoinPartyView.as_view(),             name='party_join'),
    path('party/<str:code>/start/',                        StartPartyView.as_view(),            name='party_start'),
    path('party/<str:code>/leave/',                        LeavePartyView.as_view(),            name='party_leave'),
    path('party/<str:code>/end/',                          EndPartyView.as_view(),              name='party_end'),
    path('party/<str:code>/forfeit/',                      ForfeitPartyView.as_view(),          name='party_forfeit'),
    path('party/<str:code>/pulse/',                        ExtensionPulseView.as_view(),        name='party_pulse'),
    path('party/<str:code>/rename/',                       RenamePartyView.as_view(),           name='party_rename'),
    path('party/<str:code>/invite/',                       InviteFriendView.as_view(),          name='party_invite'),
    path('party/<str:code>/kick/<int:member_id>/',         KickMemberView.as_view(),            name='party_kick'),
    path('party/<str:code>/questions/add/',                AddQuestionView.as_view(),           name='party_add_question'),
    path('party/<str:code>/questions/shuffle/',            ShuffleQuestionsView.as_view(),      name='party_shuffle'),
    path('party/<str:code>/questions/shuffle-filter/',     ShuffleWithFilterView.as_view(),     name='party_shuffle_filter'),
    path('party/<str:code>/questions/<int:qid>/remove/',   RemoveQuestionView.as_view(),        name='party_remove_question'),
    path('party/<str:code>/questions/<int:qid>/check/',    CheckCompletionView.as_view(),       name='party_check'),
    path('leetcode-problem/<int:number>/',                 LeetCodeProblemLookupView.as_view(), name='lc_problem_lookup'),
    path('topics/',                                        TopicListView.as_view(),             name='party_topics'),
]
