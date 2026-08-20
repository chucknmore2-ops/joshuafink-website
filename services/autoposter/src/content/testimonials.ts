// Client testimonials for the Facebook autoposter.
//
// GENERATED FROM lib/reviews.ts — DO NOT HAND-EDIT.
//
// This file was previously maintained by hand and drifted badly. On 2026-08-18
// an audit found three reviewers republished under INVENTED full surnames
// ("Anthony C." -> "Anthony Contaldo", "Joseph C." -> "Joseph A. Cortez",
// "Adam S." -> "Adam Smith") and at least one testimonial carrying a sentence
// the client never wrote. Those went out publicly on Facebook, attributed by
// full name, with a Zillow link offered as corroboration that did not match.
// For a licensed broker that is an FTC endorsement-guide exposure, and Josh's
// standing rule is that no client's last name appears anywhere.
//
// Every entry below is copied verbatim from lib/reviews.ts — same reviewer
// string (abbreviated, exactly as the client left it), same text, no edits.
// `location` is derived from that review's `transaction` field and is omitted
// when the review does not name one. lib/testimonial-sync.test.ts fails CI if
// this file and lib/reviews.ts ever disagree again.

export interface Testimonial {
  reviewer: string;
  text: string;
  /** Absent when the source review names no location — never invent one. */
  location?: string;
}

export const testimonials: Testimonial[] = [
  {
    reviewer: "Lindsay D.",
    text: "Josh is, without a doubt, the best realtor we've ever worked with. He went above and beyond to help us find a home that we love. He is an expert on all of the important things — negotiation, market knowledge, timing — and made the entire process seamless from start to finish.",
    location: "Gallatin, TN",
  },
  {
    reviewer: "Macallan1794",
    text: "Josh is very patient, strategic and extremely knowledgeable of the area — he understood what we wanted and helped us find our perfect home. Josh made himself fully available throughout the entire process and was always just a phone call away.",
    location: "Brentwood, TN",
  },
  {
    reviewer: "Anthony C.",
    text: "Josh was the best agent I have ever worked with. He treated this sale with the same care as he would the sale of his own home. He was responsive, friendly, knowledgeable, and always had our best interests in mind.",
  },
  {
    reviewer: "BreezyCraig",
    text: "Josh was great. Knows the area like the back of his hand. He creatively finds deals and opportunities that are not always listed. He's a prompt and clear communicator. He made the process very smooth and easy.",
    location: "Thompsons Station, TN",
  },
  {
    reviewer: "Joseph C.",
    text: "Josh is an incredible Real Estate Professional. He has an incredible amount of local knowledge and professional expertise. Josh is extremely knowledgeable about the market and always had the right answers. Highly recommend!",
    location: "Brentwood, TN",
  },
  {
    reviewer: "Adam S.",
    text: "Josh helped us buy our dream home in Williamson County, TN. His local knowledge and robust network helped us identify the perfect neighborhood for our family. He added personal touches throughout the process that made us feel like his only clients.",
    location: "Brentwood, TN",
  },
  {
    reviewer: "Brian K.",
    text: "Josh is a very knowledgeable and trustworthy agent. He was immensely helpful to our family through the entire home buying process. Josh will always be our go-to agent for any future real estate needs.",
    location: "Brentwood, TN",
  },
  {
    reviewer: "Verified Buyer",
    text: "Josh is very knowledgeable and his communication is top notch. Always answers or gets back to me real quick. We have used Josh in the past and we will continue to refer him to friends and family.",
    location: "Columbia, TN",
  },
  {
    reviewer: "Bonnie O.",
    text: "Josh was a great Real Estate agent throughout the entire transaction. He was responsive, knowledgeable, and maintained his professionalism through the process. He made what could have been a stressful experience feel easy.",
    location: "Thompsons Station, TN",
  },
  {
    reviewer: "Montooth D.",
    text: "We relocated from another state and buying and selling can be super stressful — Josh was very patient and made the move easy and fun. He even hired movers for us to help us unload. Going above and beyond is what Josh does.",
    location: "Arrington, TN",
  },
];
