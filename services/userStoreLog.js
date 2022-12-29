import { dateFormat } from "../utils/dateFormat.js";
import { ErrorException } from "../utils/ErrorException.js";

export const newUserStoreLog = async (
  user,
  store,
  linkTrack,
  provider,
  client
) => {
  const table = "usuario_tienda_log";
  const columns = `
    usuario_id, 
    tienda_id, 
    fecha_login, 
    proveedor, 
    navegador, 
    dispositivo, 
    sistema_operativo, 
    link_track_id
`;
  const usuarioTiendaLog = {
    usuario_id: user.id,
    tienda_id: store.id,
    fecha_login: dateFormat(new Date()),
    proveedor: provider,
    navegador: "test",
    dispositivo: "test",
    sistema_operativo: "test",
    link_track_id: linkTrack.id,
  };
  const values = `
    ${usuarioTiendaLog.usuario_id}, 
    ${usuarioTiendaLog.tienda_id}, 
    '${usuarioTiendaLog.fecha_login}', 
    '${usuarioTiendaLog.proveedor}', 
    '${usuarioTiendaLog.navegador}', 
    '${usuarioTiendaLog.dispositivo}', 
    '${usuarioTiendaLog.sistema_operativo}',
    ${usuarioTiendaLog.link_track_id}
  `;
  const statement = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *;`;
  try {
    const queryResults = await client.query(statement);
    const results = queryResults.rows[0];
    return results;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 500,
      message: "Error al logear al usuario",
      error: err,
    });
  }
};
