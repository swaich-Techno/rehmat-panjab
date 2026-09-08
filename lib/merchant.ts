export const merchant={
  name:"Rehmat Panjab",phone:"7009464475",
  email:process.env.REHMAT_SUPPORT_EMAIL?.trim()||null,
  hours:process.env.REHMAT_SUPPORT_HOURS?.trim()||null,
  address:process.env.REHMAT_BUSINESS_ADDRESS?.trim()||null,
};

export const policyConfig={
  shipping:{locations:process.env.REHMAT_SHIPPING_LOCATIONS,processing:process.env.REHMAT_PROCESSING_TIME,delivery:process.env.REHMAT_DELIVERY_TIME,charges:process.env.REHMAT_SHIPPING_CHARGES,courier:process.env.REHMAT_COURIER_METHOD,tracking:process.env.REHMAT_TRACKING_PROCESS,delays:process.env.REHMAT_DELAY_HANDLING,address:process.env.REHMAT_INCORRECT_ADDRESS_HANDLING},
  returns:{cancellation:process.env.REHMAT_CANCELLATION_WINDOW,window:process.env.REHMAT_RETURN_WINDOW,opened:process.env.REHMAT_OPENED_OIL_RETURNS,damage:process.env.REHMAT_DAMAGE_PROCEDURE,evidence:process.env.REHMAT_PHOTO_EVIDENCE,shipping:process.env.REHMAT_RETURN_SHIPPING,method:process.env.REHMAT_REFUND_METHOD,timeline:process.env.REHMAT_REFUND_TIMELINE,excluded:process.env.REHMAT_NON_RETURNABLE},
};

export const ownerInfoComplete=Boolean(merchant.email&&merchant.hours&&merchant.address&&Object.values(policyConfig.shipping).every(Boolean)&&Object.values(policyConfig.returns).every(Boolean));
