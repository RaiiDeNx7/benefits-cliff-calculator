/**
 * Auto-generated from "Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy - Copy.xlsx"
 * (Program specific data + Location specific data AG–AK, AM).
 * Regenerate: node scripts/build-childCareLookupData.mjs
 */
const CHILD_CARE_FPL_BY_HOUSEHOLD = [
  {
    "householdSize": 1,
    "annualFpl": 15960,
    "monthlyFpl": 1330
  },
  {
    "householdSize": 2,
    "annualFpl": 21640,
    "monthlyFpl": 1803.3333333333333
  },
  {
    "householdSize": 3,
    "annualFpl": 27320,
    "monthlyFpl": 2276.6666666666665
  },
  {
    "householdSize": 4,
    "annualFpl": 33000,
    "monthlyFpl": 2750
  },
  {
    "householdSize": 5,
    "annualFpl": 38680,
    "monthlyFpl": 3223.3333333333335
  },
  {
    "householdSize": 6,
    "annualFpl": 44360,
    "monthlyFpl": 3696.6666666666665
  },
  {
    "householdSize": 7,
    "annualFpl": 50040,
    "monthlyFpl": 4170
  },
  {
    "householdSize": 8,
    "annualFpl": 55720,
    "monthlyFpl": 4643.333333333333
  }
];

const CHILD_CARE_LIMITS_BY_HOUSEHOLD = [
  {
    "householdSize": 1,
    "smi85": 4936,
    "groupILimit": 1995,
    "groupIiLimit": 2128,
    "groupIiiLimit": 2460.5,
    "groupIvLimit": 3325
  },
  {
    "householdSize": 2,
    "smi85": 6455,
    "groupILimit": 2705,
    "groupIiLimit": 2885.3333333333335,
    "groupIiiLimit": 3336.1666666666665,
    "groupIvLimit": 4508.333333333333
  },
  {
    "householdSize": 3,
    "smi85": 7973,
    "groupILimit": 3415,
    "groupIiLimit": 3642.6666666666665,
    "groupIiiLimit": 4211.833333333333,
    "groupIvLimit": 5691.666666666666
  },
  {
    "householdSize": 4,
    "smi85": 9492,
    "groupILimit": 4125,
    "groupIiLimit": 4400,
    "groupIiiLimit": 5087.5,
    "groupIvLimit": 6875
  },
  {
    "householdSize": 5,
    "smi85": 11011,
    "groupILimit": 4835,
    "groupIiLimit": 5157.333333333334,
    "groupIiiLimit": 5963.166666666667,
    "groupIvLimit": 8058.333333333334
  },
  {
    "householdSize": 6,
    "smi85": 12529,
    "groupILimit": 5545,
    "groupIiLimit": 5914.666666666667,
    "groupIiiLimit": 6838.833333333333,
    "groupIvLimit": 9241.666666666666
  },
  {
    "householdSize": 7,
    "smi85": 12814,
    "groupILimit": 6255,
    "groupIiLimit": 6672,
    "groupIiiLimit": 7714.5,
    "groupIvLimit": 10425
  },
  {
    "householdSize": 8,
    "smi85": 13099,
    "groupILimit": 6965,
    "groupIiLimit": 7429.333333333333,
    "groupIiiLimit": 8590.166666666666,
    "groupIvLimit": 11608.333333333332
  }
];

/** @type {Record<string, { group: number, rates: number[] }>} */
const CHILD_CARE_LOCALITY_BY_NAME = {
  "Accomack": {
    "group": 1,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Albemarle": {
    "group": 2,
    "rates": [
      70,
      61,
      47,
      42,
      38
    ]
  },
  "Alexandria City": {
    "group": 4,
    "rates": [
      94,
      81,
      62,
      58,
      56
    ]
  },
  "Alleghany": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Amelia": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Amherst": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Appomattox": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Arlington County": {
    "group": 3,
    "rates": [
      94,
      81,
      70,
      70,
      59
    ]
  },
  "Augusta": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Bath": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Bedford": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Bland": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Botetourt": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Bristol": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Brunswick": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Buchanan": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Buckingham": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Buena Vista": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Campbell": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Caroline": {
    "group": 1,
    "rates": [
      83,
      72,
      55,
      50,
      35
    ]
  },
  "Carroll": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Charles City": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Charlotte": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Charlottesville City": {
    "group": 2,
    "rates": [
      70,
      61,
      47,
      42,
      38
    ]
  },
  "Chesapeake": {
    "group": 2,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Chesterfield": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      35
    ]
  },
  "Clarke": {
    "group": 3,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Colonial Heights": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      35
    ]
  },
  "Covington": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Craig": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Culpeper": {
    "group": 3,
    "rates": [
      83,
      72,
      55,
      50,
      35
    ]
  },
  "Cumberland": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Danville city": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Dickenson County": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Dinwiddie": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Emporia": {
    "group": 1,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Essex": {
    "group": 1,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Fairfax City": {
    "group": 4,
    "rates": [
      94,
      81,
      62,
      59,
      52
    ]
  },
  "Fairfax county": {
    "group": 4,
    "rates": [
      94,
      81,
      62,
      59,
      52
    ]
  },
  "Falls Church City": {
    "group": 4,
    "rates": [
      94,
      81,
      62,
      59,
      52
    ]
  },
  "Fauquier": {
    "group": 3,
    "rates": [
      83,
      72,
      55,
      50,
      35
    ]
  },
  "Floyd": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Fluvanna": {
    "group": 2,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Franklin County": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Franklin city": {
    "group": 1,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Frederick": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Fredericksburg City": {
    "group": 3,
    "rates": [
      83,
      72,
      55,
      50,
      35
    ]
  },
  "Galax City": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Giles": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Gloucester": {
    "group": 2,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Goochland": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      32
    ]
  },
  "Grayson": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Greene": {
    "group": 2,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Greensville": {
    "group": 1,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Halifax": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Hampton City": {
    "group": 2,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Hanover": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      32
    ]
  },
  "Harrisonburg City": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Henrico": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      32
    ]
  },
  "Henry": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Highland": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Hopewell City": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Isle Of Wight": {
    "group": 2,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "James City": {
    "group": 2,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "King And Queen": {
    "group": 1,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "King George": {
    "group": 3,
    "rates": [
      83,
      72,
      55,
      50,
      35
    ]
  },
  "King William": {
    "group": 1,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Lancaster": {
    "group": 1,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Lee": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Lexington City": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Loudoun": {
    "group": 3,
    "rates": [
      83,
      72,
      56,
      56,
      49
    ]
  },
  "Louisa": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Lunenburg": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Lynchburg City": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Madison": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Manassas City": {
    "group": 3,
    "rates": [
      83,
      72,
      55,
      50,
      35
    ]
  },
  "Manassas Park City": {
    "group": 3,
    "rates": [
      83,
      73,
      56,
      56,
      48
    ]
  },
  "Martinsville City": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Mathews": {
    "group": 2,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Mecklenburg": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Middlesex": {
    "group": 1,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Montgomery": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      28
    ]
  },
  "Nelson": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "New Kent": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Newport News": {
    "group": 2,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Norfolk": {
    "group": 2,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Northampton": {
    "group": 1,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Northumberland": {
    "group": 1,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Norton City": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Nottoway": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Orange": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Page": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Patrick": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Petersburg City": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Pittsylvania": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Poquoson City": {
    "group": 2,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Portsmouth City": {
    "group": 2,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Powhatan": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Prince Edward": {
    "group": 1,
    "rates": [
      64,
      56,
      43,
      39,
      28
    ]
  },
  "Prince George": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Prince William": {
    "group": 3,
    "rates": [
      83,
      72,
      55,
      50,
      43
    ]
  },
  "Pulaski": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Radford City": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Rappahannock": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      31
    ]
  },
  "Richmond City": {
    "group": 2,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Richmond County": {
    "group": 1,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Roanoke City": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Roanoke County": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Rockbridge-": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Rockingham": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Russell": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Salem City": {
    "group": 1,
    "rates": [
      67,
      58,
      45,
      41,
      29
    ]
  },
  "Scott": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Shenandoah": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Smyth": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Southampton": {
    "group": 1,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Spotsylvania": {
    "group": 3,
    "rates": [
      83,
      72,
      55,
      50,
      35
    ]
  },
  "Stafford": {
    "group": 3,
    "rates": [
      83,
      72,
      55,
      50,
      35
    ]
  },
  "Staunton City": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Suffolk": {
    "group": 2,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Surry": {
    "group": 1,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Sussex": {
    "group": 1,
    "rates": [
      69,
      60,
      47,
      41,
      29
    ]
  },
  "Tazewell": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Virginia Beach City": {
    "group": 2,
    "rates": [
      71,
      61,
      47,
      42,
      30
    ]
  },
  "Warren": {
    "group": 3,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Washington": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Waynesboro City": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Westmoreland": {
    "group": 1,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Williamsburg City": {
    "group": 2,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  },
  "Winchester City": {
    "group": 1,
    "rates": [
      70,
      61,
      47,
      42,
      30
    ]
  },
  "Wise": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "Wythe": {
    "group": 1,
    "rates": [
      63,
      55,
      42,
      38,
      27
    ]
  },
  "York": {
    "group": 2,
    "rates": [
      68,
      59,
      45,
      41,
      29
    ]
  }
};
