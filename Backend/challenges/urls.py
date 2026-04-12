from django.urls import path
from .views import (
    CreatePartyView, JoinPartyView, PartyDetailView, StartPartyView,
    AddQuestionView, RemoveQuestionView, ShuffleQuestionsView,
    CheckCompletionView, LeavePartyView, MyPartiesView,
)

urlpatterns = [
    path('party/create/',                              CreatePartyView.as_view(),      name='party_create'),
    path('party/mine/',                                MyPartiesView.as_view(),         name='party_mine'),
    path('party/<str:code>/',                          PartyDetailView.as_view(),       name='party_detail'),
    path('party/<str:code>/join/',                     JoinPartyView.as_view(),         name='party_join'),
    path('party/<str:code>/start/',                    StartPartyView.as_view(),        name='party_start'),
    path('party/<str:code>/leave/',                    LeavePartyView.as_view(),        name='party_leave'),
    path('party/<str:code>/questions/add/',            AddQuestionView.as_view(),       name='party_add_question'),
    path('party/<str:code>/questions/shuffle/',        ShuffleQuestionsView.as_view(),  name='party_shuffle'),
    path('party/<str:code>/questions/<int:qid>/remove/', RemoveQuestionView.as_view(), name='party_remove_question'),
    path('party/<str:code>/questions/<int:qid>/check/', CheckCompletionView.as_view(), name='party_check'),
]
