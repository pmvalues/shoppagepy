"""
Shoppage platform app configuration.

Replaces ``django.contrib.admin`` in INSTALLED_APPS with an AdminConfig that
points ``default_site`` at :class:`shoppage.admin.ShoppageAdminSite` — the
documented Django 5.x way to swap in a custom AdminSite (the framework's
``admin.site`` lazy proxy then wraps our class, so every app-level
``@admin.register`` decorator keeps binding to the same singleton).
"""

from django.contrib.admin.apps import AdminConfig


class ShoppageAdminConfig(AdminConfig):
    default_site = 'shoppage.admin.ShoppageAdminSite'
