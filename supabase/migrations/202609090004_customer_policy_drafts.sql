-- Structured, versioned customer-policy draft. Publication remains blocked until operational checks are recorded.
alter table public.store_policy_settings
  add column if not exists policy_version text,
  add column if not exists policy_effective_date date,
  add column if not exists support_email_verified_at timestamptz,
  add column if not exists support_phone_confirmed_at timestamptz,
  add column if not exists shipping_calculation_verified_at timestamptz,
  add column if not exists courier_configuration_verified_at timestamptz,
  add column if not exists publish_confirmed_at timestamptz;

create table if not exists public.store_policy_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  effective_date date not null,
  settings_snapshot jsonb not null,
  status text not null check(status in ('draft','published','superseded')),
  created_by uuid references public.profiles(id),
  published_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
alter table public.store_policy_versions enable row level security;
drop policy if exists "super admins read policy versions" on public.store_policy_versions;
create policy "super admins read policy versions" on public.store_policy_versions for select using(public.is_super_admin());
drop policy if exists "super admins create policy versions" on public.store_policy_versions;
create policy "super admins create policy versions" on public.store_policy_versions for insert with check(public.is_super_admin());
drop policy if exists "super admins update policy versions" on public.store_policy_versions;
create policy "super admins update policy versions" on public.store_policy_versions for update using(public.is_super_admin()) with check(public.is_super_admin());

alter table public.orders
  add column if not exists policy_version text,
  add column if not exists policies_accepted_at timestamptz,
  add column if not exists marketing_consent boolean not null default false;

update public.store_policy_settings set
  merchant=jsonb_build_object(
    'businessName','Rehmat Panjab','legalEntityName','Rehmat Panjab',
    'businessAddress','Village Bagli Khurd, Tehsil Samrala, District Ludhiana, Punjab 141412, India',
    'supportPhone','+91 98769 13550','supportEmail','support@rehmatpanjab.com',
    'supportHours','10:00 AM–7:00 PM IST, Monday–Sunday','gstNumber','Not provided'
  ),
  shipping=jsonb_build_object(
    'shippingRegions','India only','dispatchTime','1–2 business days',
    'estimatedDeliveryTime','3–7 business days after dispatch',
    'shippingCharge','Calculated using the available delivery method and disclosed before payment',
    'freeShippingThreshold','Eligible product subtotal of ₹1,000 or more',
    'courierMethod','Shiprocket is intended, subject to production configuration',
    'trackingProcess','Tracking is sent through the available order-contact method when available',
    'deliveryAttemptRules','Reshipment and verified return-to-origin costs may apply after a customer-caused failed delivery where legally permitted',
    'addressChangeRules','Within 12 hours of ordering and before dispatch',
    'lostPackageProcess','Contact support with the order number so the courier investigation can be raised',
    'damagedPackageProcess','Report as soon as possible, preferably within four hours of recorded delivery, with continuous unboxing video and photographs'
  ),
  cancellation=jsonb_build_object(
    'cancellationWindow','Within 12 hours of ordering and before packing or dispatch',
    'cancellationMethod','Contact support; cancellation is final only after Rehmat Panjab confirms it',
    'dispatchedOrdersCancellation','Ordinarily unavailable after dispatch',
    'refundMethod','Original payment method unless another lawful resolution is confirmed',
    'refundProcessingTimeline','Initiated within two business days after approval; provider credit time may take longer'
  ),
  returns=jsonb_build_object(
    'returnRequestWindow','Damage or incorrect-item reports should be made as soon as possible, preferably within four hours after recorded delivery',
    'eligibilityConditions','Verified damaged, leaking, defective or incorrect items; mandatory legal rights continue to apply',
    'openedOilRule','Opened perfume oils are not returnable for change of mind',
    'usedProductRule','Used perfume oils are not returnable for change of mind',
    'incorrectItemProcess','Provide order number, continuous unboxing video and photographs for verification',
    'damagedItemProcess','Customer may choose replacement or refund after verification, subject to availability',
    'evidenceRequirements','Clear continuous unboxing video plus photographs of packaging, shipping label and affected product',
    'returnShippingResponsibility','Follow Rehmat Panjab instructions; do not return an item without authorization',
    'exchangeAvailability','Replacement for approved claims is subject to stock availability',
    'storeCreditAvailability','Not offered unless specifically agreed as a resolution',
    'nonReturnableProducts','Change-of-mind, opened or used perfume oils are not returnable',
    'discountedItemRules','Approved refunds reflect the amount actually paid after discount; original shipping is non-refundable unless law requires otherwise'
  ),
  privacy=jsonb_build_object(
    'privacyContactEmail','support@rehmatpanjab.com',
    'dataCollected','Contact, address, order, payment-status, coupon, support, review and necessary technical information',
    'collectionPurpose','Order fulfilment, payment confirmation, support, fraud prevention, security and legal obligations',
    'supabaseInvolvement','Database, authentication and storage services',
    'razorpayInvolvement','Payment processing only when production checkout is active',
    'whatsappInvolvement','Communication only when the customer chooses WhatsApp',
    'analyticsCookies','Only necessary storage until accurate consent controls exist; optional analytics require consent',
    'retention','Only as reasonably necessary by data category for fulfilment, support, fraud prevention, accounting, legal compliance and disputes',
    'deletionCorrectionRequests','Customers may request access, correction, updating or deletion subject to lawful retention requirements',
    'ageRequirements','The service is not intended to knowingly collect unnecessary personal information from children',
    'dataSecurityStatement','Reasonable administrative and technical safeguards are used; no internet or storage system is guaranteed completely secure'
  ),
  terms=jsonb_build_object(
    'merchantIdentity','Rehmat Panjab, Village Bagli Khurd, Tehsil Samrala, District Ludhiana, Punjab 141412, India',
    'websiteEligibility','Customers must be legally capable of contracting and provide accurate information',
    'productInformationLimitations','Images, colours, fragrance perception and performance may vary',
    'pricingAvailability','Server-recorded price and inventory at confirmation are authoritative',
    'orderAcceptance','Submission does not guarantee acceptance',
    'whatsappOrderStatus','A WhatsApp message is an order request until availability, price, address and payment are confirmed',
    'paymentConfirmation','Online orders require verified payment and order acceptance; Cash on Delivery is unavailable',
    'couponsDiscounts','NEW gives eligible first-time customers 15% off their first completed purchase and is server validated',
    'shipping','India only; shipping and delivery policy forms part of these terms',
    'returns','Cancellation, return and refund policy forms part of these terms',
    'intellectualProperty','Rehmat Panjab original branding and content may not be commercially reused except as law permits',
    'inspirationDisclaimer','References are descriptive only; Rehmat Panjab is independent and the Rehmat product names remain primary',
    'misuseProhibitedConduct','No security interference, price or inventory manipulation, false claims, endpoint abuse, malicious uploads or infringement',
    'liabilityLimitations','Mandatory consumer rights are not excluded; other limitations apply only to the extent legally permitted',
    'governingLawJurisdiction','India; subject to mandatory consumer rights, courts serving Samrala, Punjab',
    'contactDetails','support@rehmatpanjab.com · +91 98769 13550 · 10:00 AM–7:00 PM IST, Monday–Sunday',
    'lastUpdatedDate','2026-09-09'
  ),
  policy_version='2026-09-09.1',policy_effective_date='2026-09-09',
  publish_status='draft',owner_approved_at=null,publish_confirmed_at=null,
  admin_notes='Approved policy copy loaded as a draft. Do not publish until mailbox send/receive, phone, shipping calculation and courier configuration checks are recorded.',
  updated_at=now()
where id=true;

update public.experience_settings
set whatsapp_number='919876913550',updated_at=now()
where id=true;

insert into public.store_policy_versions(version,effective_date,settings_snapshot,status)
select policy_version,policy_effective_date,jsonb_build_object('merchant',merchant,'shipping',shipping,'cancellation',cancellation,'returns',returns,'privacy',privacy,'terms',terms),'draft'
from public.store_policy_settings where id=true
on conflict(version) do nothing;

create or replace view public.public_store_policy_settings with (security_invoker=false) as
select id,merchant,shipping,cancellation,returns,privacy,terms,updated_at,policy_version,policy_effective_date
from public.store_policy_settings
where publish_status='published' and owner_approved_at is not null and publish_confirmed_at is not null
  and support_email_verified_at is not null and support_phone_confirmed_at is not null
  and shipping_calculation_verified_at is not null and courier_configuration_verified_at is not null;
revoke all on public.public_store_policy_settings from public;
grant select on public.public_store_policy_settings to anon,authenticated;
