-- Owner-approved public business facts and policy publication.
-- Historical policy rows remain immutable; this creates a new version.
update public.experience_settings
set whatsapp_number='917009464475',updated_at=now()
where id=true;

update public.store_policy_settings set
  merchant=merchant || jsonb_build_object(
    'businessName','Rehmat Panjab','legalEntityName','Harkirat Singh',
    'businessAddress','Village Bagli Khurd, Tehsil Samrala, District Ludhiana, Punjab 141412, India',
    'supportPhone','+91 70094 64475','supportEmail','support@rehmatpanjab.com',
    'supportHours','10:00 AM–7:00 PM IST, Monday–Sunday'
  ),
  shipping=shipping || jsonb_build_object(
    'shippingRegions','India only','dispatchTime','1–2 business days',
    'estimatedDeliveryTime','3–7 business days after dispatch',
    'shippingCharge','Calculated using the available delivery method and disclosed before payment for eligible product subtotals below ₹1,000',
    'freeShippingThreshold','Eligible product subtotal of ₹1,000 or more after product discounts and coupons, excluding shipping',
    'courierMethod','Courier delivery is arranged manually while Shiprocket production configuration remains unverified',
    'trackingProcess','Tracking information is shared when available after dispatch',
    'deliveryAttemptRules','Failed delivery or reshipment requests are reviewed manually',
    'addressChangeRules','Within 12 hours of ordering and before dispatch',
    'lostPackageProcess','Contact support with the order number so the courier issue can be investigated',
    'damagedPackageProcess','Report preferably within four hours of recorded delivery with a continuous unboxing video and photographs'
  ),
  cancellation=cancellation || jsonb_build_object(
    'cancellationWindow','Within 12 hours of ordering and before dispatch',
    'cancellationMethod','Contact support by email, phone or WhatsApp and await confirmation',
    'dispatchedOrdersCancellation','Not ordinarily available after dispatch',
    'refundMethod','Original payment method where applicable',
    'refundProcessingTimeline','Initiated within two business days after approval'
  ),
  returns=returns || jsonb_build_object(
    'returnRequestWindow','Damage or incorrect-item issues should preferably be reported within four hours after recorded delivery',
    'eligibilityConditions','Verified damaged, leaking, defective or incorrect items',
    'openedOilRule','Opened or used perfume oils are not returnable unless applicable law requires otherwise',
    'usedProductRule','Used perfume oils are not returnable for change of mind',
    'incorrectItemProcess','Provide the order number, continuous unboxing video and photographs for verification',
    'damagedItemProcess','Provide the order number, continuous unboxing video and photographs for verification',
    'evidenceRequirements','Continuous unboxing video and supporting photographs',
    'returnShippingResponsibility','Provided with an approved claim when a return is required',
    'exchangeAvailability','Replacement subject to verification and availability',
    'storeCreditAvailability','Not offered as the default remedy',
    'nonReturnableProducts','Opened or used perfume oils and change-of-mind returns after delivery',
    'discountedItemRules','Approved refunds use the amount actually paid after discount'
  ),
  terms=terms || jsonb_build_object(
    'merchantIdentity','Rehmat Panjab, operated by Harkirat Singh',
    'couponsDiscounts','Coupon NEW gives eligible first-time customers 15% off the first completed purchase',
    'shipping','India only; free standard shipping at an eligible product subtotal of ₹1,000 or more',
    'returns','No change-of-mind return after delivery; verified damage or incorrect-item remedies remain available',
    'governingLawJurisdiction','Samrala, Punjab, India',
    'contactDetails','support@rehmatpanjab.com · +91 70094 64475 · 10:00 AM–7:00 PM IST, Monday–Sunday',
    'lastUpdatedDate','2026-09-22'
  ),
  privacy=privacy || jsonb_build_object(
    'privacyContactEmail','support@rehmatpanjab.com',
    'marketingConsent','Optional marketing consent is not preselected',
    'razorpayInvolvement','Online payment processing remains inactive until production safeguards are verified',
    'shippingProviderInvolvement','Shiprocket is not active until production configuration is verified'
  ),
  policy_version='2026-09-22.1',policy_effective_date='2026-09-22',
  publish_status='published',owner_approved_at=now(),publish_confirmed_at=now(),
  support_email_verified_at=now(),support_phone_confirmed_at=now(),shipping_calculation_verified_at=now(),
  courier_configuration_verified_at=null,
  admin_notes='Owner-confirmed public policy version. Razorpay and Shiprocket remain inactive pending their separate production-readiness gates.',
  updated_at=now()
where id=true;

insert into public.store_policy_versions(version,effective_date,settings_snapshot,status,published_at)
select '2026-09-22.1','2026-09-22',jsonb_build_object('merchant',merchant,'shipping',shipping,'cancellation',cancellation,'returns',returns,'privacy',privacy,'terms',terms),'published',now()
from public.store_policy_settings where id=true
on conflict(version) do nothing;

update public.provider_readiness
set status='pending',updated_at=now()
where provider in ('razorpay','shiprocket') and status<>'verified';
