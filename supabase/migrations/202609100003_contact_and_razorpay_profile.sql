-- Owner-approved contact correction and Razorpay KYC/profile evidence.
-- Checkout remains disabled; credentials, webhook and live-payment checks remain incomplete.
update public.experience_settings set whatsapp_number='917009464475',updated_at=now() where id=true;

update public.store_policy_settings set
  merchant=jsonb_set(merchant,'{supportPhone}','"+91 70094 64475"'::jsonb,true),
  terms=jsonb_set(terms,'{contactDetails}','"support@rehmatpanjab.com · +91 70094 64475 · 10:00 AM–7:00 PM IST, Monday–Sunday"'::jsonb,true),
  support_phone_confirmed_at=now(),updated_at=now()
where id=true;

update public.store_policy_versions set
  settings_snapshot=jsonb_set(jsonb_set(settings_snapshot,'{merchant,supportPhone}','"+91 70094 64475"'::jsonb,true),'{terms,contactDetails}','"support@rehmatpanjab.com · +91 70094 64475 · 10:00 AM–7:00 PM IST, Monday–Sunday"'::jsonb,true)
where version='2026-09-10.1' and status='draft';

update public.provider_readiness set status='pending',checklist=checklist || jsonb_build_object(
  'razorpay_kyc_approved',true,
  'razorpay_payment_link_verified',true,
  'razorpay_payment_link','https://razorpay.me/@harkiratsingh5450',
  'razorpay_evidence','Owner-supplied Razorpay app screenshot dated 2026-09-09; KYC verification complete and handle visible.'
),updated_at=now()
where provider='razorpay';
