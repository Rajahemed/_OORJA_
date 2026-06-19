/**
 * utils/locationData.js
 * Builds an in-memory lookup map from india-pincode data (164K+ records).
 * Runs ONCE at startup. O(1) lookups afterwards.
 */

let stateList = [];
let cityByState = {};        // { "MAHARASHTRA": ["AHMEDNAGAR","PUNE",...] }
let pincodeByStateCity = {}; // { "MAHARASHTRA|PUNE": ["411001","411002",...] }
let built = false;

function build() {
  if (built) return;
  built = true;

  let data;
  try {
    const { getIndiaPincode } = require('india-pincode');
    const result = getIndiaPincode();
    data = result._data; // internal array of 164K records
  } catch (e) {
    console.error('[locationData] Failed to load india-pincode:', e.message);
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.error('[locationData] No data loaded from india-pincode');
    return;
  }

  const stateSet = new Set();

  for (const row of data) {
    const state    = (row.state    || '').trim().toUpperCase();
    const district = (row.district || '').trim().toUpperCase();
    const pincode  = (row.pincode  || '').trim();

    if (!state || !district || !pincode) continue;

    stateSet.add(state);

    if (!cityByState[state]) cityByState[state] = new Set();
    cityByState[state].add(district);

    const key = `${state}|${district}`;
    if (!pincodeByStateCity[key]) pincodeByStateCity[key] = new Set();
    pincodeByStateCity[key].add(pincode);
  }

  // Convert sets to sorted arrays for consistent output
  stateList = [...stateSet].sort();
  for (const st of stateList) {
    cityByState[st] = [...cityByState[st]].sort();
  }
  for (const key of Object.keys(pincodeByStateCity)) {
    pincodeByStateCity[key] = [...pincodeByStateCity[key]].sort();
  }

  console.log(`[locationData] Ready: ${stateList.length} states, ${Object.keys(pincodeByStateCity).length} district groups`);
}

// Pre-build on module load (runs in background at server start)
try { build(); } catch(e) { console.error('[locationData] Build error:', e.message); }

function getStates() {
  build();
  return stateList;
}

function getCities(state) {
  build();
  return cityByState[(state || '').trim().toUpperCase()] || [];
}

function getPincodes(state, city) {
  build();
  const key = `${(state || '').trim().toUpperCase()}|${(city || '').trim().toUpperCase()}`;
  return pincodeByStateCity[key] || [];
}

module.exports = { getStates, getCities, getPincodes };
