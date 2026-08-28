from apps.merchants.models import (
    ClaimStateChoices,
    Merchant,
    VerificationStateChoices,
)
from django.contrib.auth.models import User
from django.test import Client, TestCase


class AuthBoundaryTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user('owner', 'owner@example.com', 'pw')
        self.other = User.objects.create_user('other', 'other@example.com', 'pw')
        self.merchant = Merchant.objects.create(
            canonical_id='m_auth_test',
            name='Auth Test Store',
            owner=self.owner,
            claim_state=ClaimStateChoices.CLAIMED,
            verification_state=VerificationStateChoices.UNVERIFIED,
            trust_score=80,
        )

    def test_dashboard_requires_login(self):
        resp = self.client.get('/merchant/dashboard/')
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/accounts/login/', resp['Location'])

    def test_owner_can_view_own_dashboard(self):
        self.client.force_login(self.owner)
        resp = self.client.get(
            f'/merchant/dashboard/?merchantId={self.merchant.canonical_id}'
        )
        self.assertEqual(resp.status_code, 200)

    def test_other_user_cannot_view_others_dashboard(self):
        self.client.force_login(self.other)
        resp = self.client.get(
            f'/merchant/dashboard/?merchantId={self.merchant.canonical_id}'
        )
        # A non-owner must not see another merchant's private data.
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(resp['Location'], '/merchant/claim/')

    def test_write_endpoint_requires_login(self):
        resp = self.client.post(f'/merchant/draft/{self.merchant.canonical_id}/action/')
        self.assertEqual(resp.status_code, 302)
