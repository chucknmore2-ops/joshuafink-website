export interface Review {
  reviewer: string;
  date: string;
  rating: number;
  transaction: string;
  text: string;
}

export const reviews: Review[] = [
  {
    reviewer: "Lindsay D.",
    date: "July 2024",
    rating: 5,
    transaction: "Bought a home in Gallatin, TN",
    text: "Josh is, without a doubt, the best realtor we've ever worked with. He went above and beyond to help us find a home that we love. He is an expert on all of the important things — negotiation, market knowledge, timing — and made the entire process seamless from start to finish.",
  },
  {
    reviewer: "Macallan1794",
    date: "January 2024",
    rating: 5,
    transaction: "Bought a home in Brentwood, TN",
    text: "Josh is very patient, strategic and extremely knowledgeable of the area — he understood what we wanted and helped us find our perfect home. Josh made himself fully available throughout the entire process and was always just a phone call away.",
  },
  {
    reviewer: "Anthony Contaldo",
    date: "January 2024",
    rating: 5,
    transaction: "Sold a home",
    text: "Josh was the best agent I have ever worked with. He treated this sale with the same care as he would the sale of his own home. He was responsive, friendly, knowledgeable, and always had our best interests in mind.",
  },
  {
    reviewer: "BreezyCraig",
    date: "March 2022",
    rating: 5,
    transaction: "Bought a home in Thompsons Station, TN",
    text: "Josh was great. Knows the area like the back of his hand. He creatively finds deals and opportunities that are not always listed. He's a prompt and clear communicator. He made the process very smooth and easy.",
  },
  {
    reviewer: "Joseph A. Cortez",
    date: "November 2021",
    rating: 5,
    transaction: "Bought a home in Brentwood, TN",
    text: "Josh is an incredible Real Estate Professional. He has an incredible amount of local knowledge and professional expertise. Josh is extremely knowledgeable about the market and always had the right answers. Highly recommend!",
  },
  {
    reviewer: "Adam Smith",
    date: "November 2021",
    rating: 5,
    transaction: "Bought a home in Brentwood, TN",
    text: "Josh helped us buy our dream home in Williamson County, TN. His local knowledge and robust network helped us identify the perfect neighborhood for our family. He added personal touches throughout the process that made us feel like his only clients.",
  },
  {
    reviewer: "Brian K.",
    date: "September 2020",
    rating: 5,
    transaction: "Bought a home in Brentwood, TN",
    text: "Josh is a very knowledgeable and trustworthy agent. He was immensely helpful to our family through the entire home buying process. Josh will always be our go-to agent for any future real estate needs.",
  },
  {
    reviewer: "Verified Buyer",
    date: "August 2020",
    rating: 5,
    transaction: "Bought and sold a home in Columbia, TN",
    text: "Josh is very knowledgeable and his communication is top notch. Always answers or gets back to me real quick. We have used Josh in the past and we will continue to refer him to friends and family.",
  },
  {
    reviewer: "Bonnie O.",
    date: "August 2020",
    rating: 5,
    transaction: "Bought and sold a home in Thompsons Station, TN",
    text: "Josh was a great Real Estate agent throughout the entire transaction. He was responsive, knowledgeable, and maintained his professionalism through the process. He made what could have been a stressful experience feel easy.",
  },
  {
    reviewer: "Montooth D.",
    date: "August 2020",
    rating: 5,
    transaction: "Relocated and bought a home in Arrington, TN",
    text: "We relocated from another state and buying and selling can be super stressful — Josh was very patient and made the move easy and fun. He even hired movers for us to help us unload. Going above and beyond is what Josh does.",
  },
];

export const reviewStats = {
  total: 218,
  rating: 5.0,
  zillowUrl: "https://www.zillow.com/profile/JoshuaFinkGroup",
};
