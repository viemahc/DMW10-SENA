from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('register/', views.register, name='register'),
    path('profile/', views.get_user_profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('check-auth/', views.check_auth, name='check_auth'),
    # Admin endpoints
    path('admin/users/', views.get_all_users, name='get_all_users'),
    path('admin/users/<int:user_id>/', views.get_user_detail_admin, name='get_user_detail_admin'),
    path('admin/users/<int:user_id>/assign-role/', views.assign_role, name='assign_role'),
    path('admin/users/<int:user_id>/remove-role/<int:role_id>/', views.remove_role, name='remove_role'),
    path('admin/roles/', views.get_all_roles, name='get_all_roles'),
]
