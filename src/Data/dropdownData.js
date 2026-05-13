// Dropdown data for filters (loaded from file instead of API)

export const companyNames = [
  'Acme Corporation',
  'Tech Solutions Inc',
  'Global Enterprises',
  'Innovative Labs',
  'Prime Industries',
  'Apex Technologies',
  'Strategic Partners',
  'Dynamic Systems',
  'Future Corp',
  'Elite Services',
];

export const companyTypes = [
  'Technology',
  'Manufacturing',
  'Retail',
  'Services',
  'Healthcare',
  'Finance',
  'Education',
  'Consulting',
];

export const locationData = {
  'California': {
    counties: {
      'Los Angeles County': ['Los Angeles', 'Long Beach', 'Santa Monica', 'Pasadena'],
      'San Francisco County': ['San Francisco', 'Daly City', 'South San Francisco'],
      'San Diego County': ['San Diego', 'Chula Vista', 'Oceanside', 'Escondido'],
      'Orange County': ['Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach'],
    },
    cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland', 'San Jose'],
  },
  'Texas': {
    counties: {
      'Harris County': ['Houston', 'Pasadena', 'Baytown', 'Spring'],
      'Dallas County': ['Dallas', 'Irving', 'Garland', 'Richardson'],
      'Travis County': ['Austin', 'Round Rock', 'Cedar Park', 'Pflugerville'],
      'Bexar County': ['San Antonio', 'New Braunfels', 'Universal City', 'Converse'],
    },
    cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
  },
  'New York': {
    counties: {
      'New York County': ['Manhattan', 'Harlem', 'Greenwich Village', 'SoHo'],
      'Kings County': ['Brooklyn', 'Williamsburg', 'Park Slope', 'Brighton Beach'],
      'Queens County': ['Queens', 'Flushing', 'Astoria', 'Jamaica'],
      'Nassau County': ['Hempstead', 'Freeport', 'Mineola', 'Garden City'],
    },
    cities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany'],
  },
  'Florida': {
    counties: {
      'Miami-Dade County': ['Miami', 'Hialeah', 'Miami Beach', 'Coral Gables'],
      'Broward County': ['Fort Lauderdale', 'Hollywood', 'Pompano Beach', 'Miramar'],
      'Palm Beach County': ['West Palm Beach', 'Boca Raton', 'Delray Beach', 'Boynton Beach'],
      'Orange County': ['Orlando', 'Winter Park', 'Apopka', 'Ocoee'],
    },
    cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee', 'Fort Lauderdale'],
  },
  'Illinois': {
    counties: {
      'Cook County': ['Chicago', 'Arlington Heights', 'Evanston', 'Schaumburg'],
      'DuPage County': ['Aurora', 'Naperville', 'Wheaton', 'Glen Ellyn'],
      'Lake County': ['Waukegan', 'North Chicago', 'Lake Forest', 'Libertyville'],
      'Will County': ['Joliet', 'Bolingbrook', 'Plainfield', 'Romeoville'],
    },
    cities: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield'],
  },
};

export const states = Object.keys(locationData);

export const getCountiesByState = (state) => {
  return locationData[state]?.counties ? Object.keys(locationData[state].counties) : [];
};

export const getCitiesByCounty = (state, county) => {
  return locationData[state]?.counties?.[county] || [];
};

export const getAllCitiesByState = (state) => {
  return locationData[state]?.cities || [];
};

export const allCounties = Object.values(locationData).flatMap(state => 
  Object.keys(state.counties)
);

export const allCities = Object.values(locationData).flatMap(state => 
  state.cities
);
