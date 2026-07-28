export interface CityItem {
  city: string;
  state: string;
  country: string;
}

export const CITIES_DATA: CityItem[] = [
  // Gujarat
  { city: "Mehsana", state: "Gujarat", country: "India" },
  { city: "Ahmedabad", state: "Gujarat", country: "India" },
  { city: "Surat", state: "Gujarat", country: "India" },
  { city: "Vadodara", state: "Gujarat", country: "India" },
  { city: "Rajkot", state: "Gujarat", country: "India" },
  { city: "Bhavnagar", state: "Gujarat", country: "India" },
  { city: "Jamnagar", state: "Gujarat", country: "India" },
  { city: "Gandhinagar", state: "Gujarat", country: "India" },
  { city: "Junagadh", state: "Gujarat", country: "India" },
  { city: "Anand", state: "Gujarat", country: "India" },
  { city: "Navsari", state: "Gujarat", country: "India" },
  { city: "Morbi", state: "Gujarat", country: "India" },
  { city: "Bharuch", state: "Gujarat", country: "India" },
  { city: "Valsad", state: "Gujarat", country: "India" },
  { city: "Bhuj", state: "Gujarat", country: "India" },
  { city: "Patan", state: "Gujarat", country: "India" },
  { city: "Palanpur", state: "Gujarat", country: "India" },
  { city: "Porbandar", state: "Gujarat", country: "India" },
  { city: "Vapi", state: "Gujarat", country: "India" },
  { city: "Godhra", state: "Gujarat", country: "India" },
  { city: "Amreli", state: "Gujarat", country: "India" },
  { city: "Botad", state: "Gujarat", country: "India" },

  // Maharashtra
  { city: "Mumbai", state: "Maharashtra", country: "India" },
  { city: "Pune", state: "Maharashtra", country: "India" },
  { city: "Nagpur", state: "Maharashtra", country: "India" },
  { city: "Thane", state: "Maharashtra", country: "India" },
  { city: "Nashik", state: "Maharashtra", country: "India" },
  { city: "Aurangabad", state: "Maharashtra", country: "India" },
  { city: "Solapur", state: "Maharashtra", country: "India" },
  { city: "Kolhapur", state: "Maharashtra", country: "India" },
  { city: "Navi Mumbai", state: "Maharashtra", country: "India" },

  // Karnataka
  { city: "Bengaluru", state: "Karnataka", country: "India" },
  { city: "Bangalore", state: "Karnataka", country: "India" },
  { city: "Mysuru", state: "Karnataka", country: "India" },
  { city: "Hubballi", state: "Karnataka", country: "India" },
  { city: "Mangaluru", state: "Karnataka", country: "India" },

  // Delhi NCR
  { city: "Delhi", state: "Delhi", country: "India" },
  { city: "New Delhi", state: "Delhi", country: "India" },
  { city: "Gurugram", state: "Haryana", country: "India" },
  { city: "Gurgaon", state: "Haryana", country: "India" },
  { city: "Noida", state: "Uttar Pradesh", country: "India" },
  { city: "Faridabad", state: "Haryana", country: "India" },
  { city: "Ghaziabad", state: "Uttar Pradesh", country: "India" },

  // Rajasthan
  { city: "Jaipur", state: "Rajasthan", country: "India" },
  { city: "Jodhpur", state: "Rajasthan", country: "India" },
  { city: "Udaipur", state: "Rajasthan", country: "India" },
  { city: "Kota", state: "Rajasthan", country: "India" },
  { city: "Ajmer", state: "Rajasthan", country: "India" },
  { city: "Bikaner", state: "Rajasthan", country: "India" },

  // Uttar Pradesh
  { city: "Lucknow", state: "Uttar Pradesh", country: "India" },
  { city: "Kanpur", state: "Uttar Pradesh", country: "India" },
  { city: "Varanasi", state: "Uttar Pradesh", country: "India" },
  { city: "Agra", state: "Uttar Pradesh", country: "India" },
  { city: "Prayagraj", state: "Uttar Pradesh", country: "India" },
  { city: "Meerut", state: "Uttar Pradesh", country: "India" },

  // Madhya Pradesh
  { city: "Indore", state: "Madhya Pradesh", country: "India" },
  { city: "Bhopal", state: "Madhya Pradesh", country: "India" },
  { city: "Gwalior", state: "Madhya Pradesh", country: "India" },
  { city: "Jabalpur", state: "Madhya Pradesh", country: "India" },
  { city: "Ujjain", state: "Madhya Pradesh", country: "India" },

  // Telangana & Andhra Pradesh
  { city: "Hyderabad", state: "Telangana", country: "India" },
  { city: "Warangal", state: "Telangana", country: "India" },
  { city: "Visakhapatnam", state: "Andhra Pradesh", country: "India" },
  { city: "Vijayawada", state: "Andhra Pradesh", country: "India" },
  { city: "Guntur", state: "Andhra Pradesh", country: "India" },

  // Tamil Nadu
  { city: "Chennai", state: "Tamil Nadu", country: "India" },
  { city: "Coimbatore", state: "Tamil Nadu", country: "India" },
  { city: "Madurai", state: "Tamil Nadu", country: "India" },
  { city: "Tiruchirappalli", state: "Tamil Nadu", country: "India" },
  { city: "Salem", state: "Tamil Nadu", country: "India" },

  // West Bengal
  { city: "Kolkata", state: "West Bengal", country: "India" },
  { city: "Siliguri", state: "West Bengal", country: "India" },
  { city: "Howrah", state: "West Bengal", country: "India" },

  // Punjab, Haryana, Chandigarh
  { city: "Chandigarh", state: "Chandigarh", country: "India" },
  { city: "Ludhiana", state: "Punjab", country: "India" },
  { city: "Amritsar", state: "Punjab", country: "India" },
  { city: "Jalandhar", state: "Punjab", country: "India" },

  // Kerala
  { city: "Kochi", state: "Kerala", country: "India" },
  { city: "Thiruvananthapuram", state: "Kerala", country: "India" },
  { city: "Kozhikode", state: "Kerala", country: "India" },

  // Bihar, Jharkhand, Odisha
  { city: "Patna", state: "Bihar", country: "India" },
  { city: "Gaya", state: "Bihar", country: "India" },
  { city: "Ranchi", state: "Jharkhand", country: "India" },
  { city: "Jamshedpur", state: "Jharkhand", country: "India" },
  { city: "Bhubaneswar", state: "Odisha", country: "India" },
  { city: "Cuttack", state: "Odisha", country: "India" },

  // Uttarakhand, Himachal, Jammu
  { city: "Dehradun", state: "Uttarakhand", country: "India" },
  { city: "Haridwar", state: "Uttarakhand", country: "India" },
  { city: "Shimla", state: "Himachal Pradesh", country: "India" },
  { city: "Jammu", state: "Jammu and Kashmir", country: "India" },
  { city: "Srinagar", state: "Jammu and Kashmir", country: "India" },

  // Global Hubs
  { city: "New York", state: "New York", country: "United States" },
  { city: "San Francisco", state: "California", country: "United States" },
  { city: "London", state: "England", country: "United Kingdom" },
  { city: "Toronto", state: "Ontario", country: "Canada" },
  { city: "Sydney", state: "New South Wales", country: "Australia" },
  { city: "Dubai", state: "Dubai", country: "United Arab Emirates" },
  { city: "Singapore", state: "Singapore", country: "Singapore" },
  { city: "Tokyo", state: "Tokyo", country: "Japan" },
  { city: "Berlin", state: "Berlin", country: "Germany" },
];
