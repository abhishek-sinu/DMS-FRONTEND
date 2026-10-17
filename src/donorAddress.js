export function buildAddress(donor) {
  if (!donor) return '';
  const newParts = [
    donor.address_line1,
    donor.address_line2,
    donor.post_office,
    donor.city,
    donor.district,
    donor.state,
    donor.pin_code,
    donor.country,
  ].filter(Boolean);
  if (newParts.length) return newParts.join(' , ');
  const parts = [
    donor.address_house,
    donor.address_city,
    donor.address_state,
    donor.address_house || donor.address_city ? 'India' : '',
    donor.address_pin,
  ].filter(Boolean);
  if (parts.length) return parts.join(' , ');
  return donor.address || '';
}
