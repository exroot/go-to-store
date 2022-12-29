import { dateFormat } from "../utils/dateFormat.js";
import { ErrorException } from "../utils/ErrorException.js";

export const createLinkTrack = async (
  user,
  store,
  cashback,
  partner,
  clientIP,
  token,
  client
) => {
  const table = "links_track";
  const columns = `
    token, 
    user_id, 
    cashback_id, 
    partner_id, 
    store_id, 
    origin_ip, 
    pais_id, 
    is_active, 
    is_used, 
    created_at, 
    updated_at
  `;
  const linkTrack = {
    token,
    user_id: user.id,
    cashback_id: cashback ? cashback.id : null,
    partner_id: partner ? partner.id : null,
    store_id: store.id,
    origin_ip: clientIP,
    pais_id: store.pais_id,
    is_active: true,
    is_used: false,
    created_at: dateFormat(new Date()),
    updated_at: dateFormat(new Date()),
  };
  const values = `
    '${linkTrack.token}', 
    ${linkTrack.user_id}, 
    ${linkTrack.cashback_id}, 
    ${linkTrack.partner_id}, 
    ${linkTrack.store_id}, 
    '${linkTrack.origin_ip}', 
    ${linkTrack.pais_id},
    ${linkTrack.is_active}, 
    ${linkTrack.is_used}, 
    '${linkTrack.created_at}', 
    '${linkTrack.updated_at}'
  `;
  const statement = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *;`;
  try {
    const queryResults = await client.query(statement);
    const results = queryResults.rows[0];
    return results;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 500,
      message: "Error al crear link track",
      error: err,
    });
  }
};
