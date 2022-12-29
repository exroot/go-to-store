import { ErrorException } from "../utils/ErrorException.js";

export const getUserById = async (userId, client) => {
  const table = "users";
  const columns = "*";
  const conditions = `id = ${userId}`;
  const statement = `SELECT ${columns} FROM ${table} WHERE ${conditions}`;
  try {
    const queryResults = await client.query(statement);
    const results = queryResults.rows[0];
    if (!results) {
      throw new ErrorException({
        httpStatus: 404,
        message: "Usuario no encontrado",
        error: "Usuario no encontrado",
      });
    }
    return results;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 500,
      message: "Error al buscar usuario",
      error: err,
    });
  }
};
