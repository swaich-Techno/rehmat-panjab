export const settingsFields = {
  merchant: ["businessName","legalEntityName","businessAddress","supportPhone","supportEmail","supportHours","gstNumber"],
  shipping: ["shippingRegions","dispatchTime","estimatedDeliveryTime","shippingCharge","freeShippingThreshold","courierMethod","trackingProcess","deliveryAttemptRules","addressChangeRules","lostPackageProcess","damagedPackageProcess"],
  cancellation: ["cancellationWindow","cancellationMethod","dispatchedOrdersCancellation","refundMethod","refundProcessingTimeline"],
  returns: ["returnRequestWindow","eligibilityConditions","openedOilRule","usedProductRule","incorrectItemProcess","damagedItemProcess","evidenceRequirements","returnShippingResponsibility","exchangeAvailability","storeCreditAvailability","nonReturnableProducts","discountedItemRules"],
  privacy: ["privacyContactEmail","dataCollected","collectionPurpose","supabaseInvolvement","razorpayInvolvement","whatsappInvolvement","analyticsCookies","retention","deletionCorrectionRequests","ageRequirements","dataSecurityStatement"],
  terms: ["merchantIdentity","websiteEligibility","productInformationLimitations","pricingAvailability","orderAcceptance","whatsappOrderStatus","paymentConfirmation","couponsDiscounts","shipping","returns","intellectualProperty","inspirationDisclaimer","misuseProhibitedConduct","liabilityLimitations","governingLawJurisdiction","contactDetails","lastUpdatedDate"],
} as const;
export type SettingsGroup = keyof typeof settingsFields;
export type StoreSettings = Record<SettingsGroup, Record<string,string>>;
export const defaultStoreSettings: StoreSettings = {merchant:{businessName:"Rehmat Panjab",supportPhone:"+91 70094 66475",supportEmail:"support@rehmatpanjab.com"},shipping:{},cancellation:{},returns:{},privacy:{},terms:{}};
export function missingStoreFields(settings:StoreSettings){return (Object.keys(settingsFields) as SettingsGroup[]).flatMap(group=>settingsFields[group].filter(field=>!settings[group][field]?.trim()).map(field=>`${group}.${field}`));}
export function policiesComplete(settings:StoreSettings){return missingStoreFields(settings).length===0;}
export function supportedTrustItems(settings:StoreSettings){const values=["Concentrated perfume oil"];if(settings.shipping.shippingRegions)values.push(`Delivery: ${settings.shipping.shippingRegions}`);if(settings.merchant.supportPhone||settings.merchant.supportEmail)values.push(`Support: ${settings.merchant.supportEmail||settings.merchant.supportPhone}`);if(settings.returns.damagedItemProcess)values.push("Return or damage assistance");return values;}
