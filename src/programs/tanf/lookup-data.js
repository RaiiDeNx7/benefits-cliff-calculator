/**
 * Auto-generated from FY2026 workbook (Program + Location col B for TANF A3).
 * Regenerate: npm run build:tanf-data
 */

const TANF_STANDARD_DEDUCTION_BY_SIZE = [
  {
    "size": 1,
    "deduction": 209
  },
  {
    "size": 2,
    "deduction": 209
  },
  {
    "size": 3,
    "deduction": 209
  },
  {
    "size": 4,
    "deduction": 223
  },
  {
    "size": 5,
    "deduction": 261
  },
  {
    "size": 6,
    "deduction": 299
  },
  {
    "size": 7,
    "deduction": 299
  },
  {
    "size": 8,
    "deduction": 299
  }
];

const TANF_MONTHLY_150_FPL_BY_HH = [
  {
    "hh": 1,
    "monthly150": 1330
  },
  {
    "hh": 2,
    "monthly150": 1803.3333333333333
  },
  {
    "hh": 3,
    "monthly150": 2276.6666666666665
  },
  {
    "hh": 4,
    "monthly150": 2750
  },
  {
    "hh": 5,
    "monthly150": 3223.3333333333335
  },
  {
    "hh": 6,
    "monthly150": 3696.6666666666665
  },
  {
    "hh": 7,
    "monthly150": 4170
  },
  {
    "hh": 8,
    "monthly150": 4643.333333333333
  }
];

const TANF_STANDARD_OF_ASSISTANCE_BY_HH = [
  {
    "hh": 1,
    "group2": 262,
    "group1": 366
  },
  {
    "hh": 2,
    "group2": 385,
    "group1": 489
  },
  {
    "hh": 3,
    "group2": 482,
    "group1": 587
  },
  {
    "hh": 4,
    "group2": 577,
    "group1": 681
  },
  {
    "hh": 5,
    "group2": 681,
    "group1": 811
  },
  {
    "hh": 6,
    "group2": 761,
    "group1": 887
  },
  {
    "hh": 7,
    "group2": 851,
    "group1": 979
  },
  {
    "hh": 8,
    "group2": 951,
    "group1": 1079
  }
];

const TANF_MAX_GROSS_INCOME_BY_HH = [
  {
    "hh": 1,
    "group2": 524,
    "group1": 730
  },
  {
    "hh": 2,
    "group2": 767,
    "group1": 974
  },
  {
    "hh": 3,
    "group2": 966,
    "group1": 1175
  },
  {
    "hh": 4,
    "group2": 1152,
    "group1": 1361
  },
  {
    "hh": 5,
    "group2": 1361,
    "group1": 1622
  },
  {
    "hh": 6,
    "group2": 1522,
    "group1": 1773
  },
  {
    "hh": 7,
    "group2": 1703,
    "group1": 1960
  },
  {
    "hh": 8,
    "group2": 1901,
    "group1": 2158
  }
];

const TANF_VIEW_I2_CAP_GROUP2 = 723;

const TANF_VIEW_I2_CAP_GROUP1 = 861;

/** @type {Record<string, number>} locality → TANF-VIEW A3 (1 or 2) */
const TANF_VIEW_A3_BY_LOCALITY = {
  "Accomack": 2,
  "Albemarle": 3,
  "Alexandria City": 3,
  "Alleghany": 2,
  "Amelia": 2,
  "Amherst": 2,
  "Appomattox": 2,
  "Arlington County": 3,
  "Augusta": 3,
  "Bath": 2,
  "Bedford": 2,
  "Bland": 2,
  "Botetourt": 2,
  "Bristol": 2,
  "Brunswick": 2,
  "Buchanan": 2,
  "Buckingham": 2,
  "Buena Vista": 2,
  "Campbell": 2,
  "Caroline": 3,
  "Carroll": 2,
  "Charles City": 2,
  "Charlotte": 2,
  "Charlottesville City": 3,
  "Chesapeake": 2,
  "Chesterfield": 2,
  "Clarke": 2,
  "Colonial Heights": 3,
  "Covington": 2,
  "Craig": 2,
  "Culpeper": 2,
  "Cumberland": 2,
  "Danville city": 2,
  "Dickenson County": 2,
  "Dinwiddie": 2,
  "Emporia": 2,
  "Essex": 2,
  "Fairfax City": 3,
  "Fairfax county": 3,
  "Falls Church City": 3,
  "Fauquier": 3,
  "Floyd": 2,
  "Fluvanna": 2,
  "Franklin city": 2,
  "Franklin County": 2,
  "Frederick": 2,
  "Fredericksburg City": 3,
  "Galax City": 2,
  "Giles": 2,
  "Gloucester": 2,
  "Goochland": 2,
  "Grayson": 2,
  "Greene": 2,
  "Greensville": 2,
  "Halifax": 2,
  "Hampton City": 3,
  "Hanover": 2,
  "Harrisonburg City": 2,
  "Henrico": 2,
  "Henry": 2,
  "Highland": 2,
  "Hopewell City": 2,
  "Isle Of Wight": 2,
  "James City": 3,
  "King And Queen": 2,
  "King George": 3,
  "King William": 2,
  "Lancaster": 2,
  "Lee": 2,
  "Lexington City": 2,
  "Loudoun": 2,
  "Louisa": 2,
  "Lunenburg": 2,
  "Lynchburg City": 2,
  "Madison": 2,
  "Manassas City": 3,
  "Manassas Park City": 3,
  "Martinsville City": 2,
  "Mathews": 2,
  "Mecklenburg": 2,
  "Middlesex": 2,
  "Montgomery": 3,
  "Nelson": 2,
  "New Kent": 2,
  "Newport News": 3,
  "Norfolk": 2,
  "Northampton": 2,
  "Northumberland": 2,
  "Norton City": 2,
  "Nottoway": 2,
  "Orange": 2,
  "Page": 2,
  "Patrick": 2,
  "Petersburg City": 2,
  "Pittsylvania": 2,
  "Poquoson City": 3,
  "Portsmouth City": 2,
  "Powhatan": 2,
  "Prince Edward": 2,
  "Prince George": 2,
  "Prince William": 3,
  "Pulaski": 2,
  "Radford City": 2,
  "Rappahannock": 2,
  "Richmond City": 2,
  "Richmond County": 2,
  "Roanoke City": 2,
  "Roanoke County": 2,
  "Rockbridge-": 2,
  "Rockingham": 2,
  "Russell": 2,
  "Salem City": 2,
  "Scott": 2,
  "Shenandoah": 2,
  "Smyth": 2,
  "Southampton": 2,
  "Spotsylvania": 3,
  "Stafford": 3,
  "Staunton City": 3,
  "Suffolk": 2,
  "Surry": 2,
  "Sussex": 2,
  "Tazewell": 2,
  "Virginia Beach City": 2,
  "Warren": 2,
  "Washington": 2,
  "Waynesboro City": 3,
  "Westmoreland": 2,
  "Williamsburg City": 2,
  "Winchester City": 2,
  "Wise": 2,
  "Wythe": 2,
  "York": 3
};
