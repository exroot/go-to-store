import { getUserById } from "./services/users.js";
import { ErrorException } from "./utils/ErrorException.js";
import { fromBase64 } from "./utils/base64.js";
import dotenv from "dotenv";
import pkg from "pg";
import { getStoreById } from "./services/stores.js";
import { createLinkTrack } from "./services/linkTracks.js";
import { getCashbackByIdAndStore } from "./services/cashbacks.js";
import { generateLink, generateTrackerInfo } from "./services/trackerInfo.js";
import { getStoreConfigs } from "./services/storeConfigs.js";
import { newUserStoreLog } from "./services/userStoreLog.js";

const handler = async (event) => {
  dotenv.config();
  const { queryStringParameters } = event;
  const { Client } = pkg;

  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
  });
  try {
    await client.connect((err) => {
      if (err) {
        throw new ErrorException({
          httpStatus: 500,
          message: "Internal Server Error",
          error: err,
        });
      }
    });
    const user = await getUserFromRequest(queryStringParameters, client);
    const store = await getStoreFromRequest(queryStringParameters, client);
    const cashback = await getCashbackFromRequest(
      queryStringParameters,
      store,
      client
    );
    const provider = getProviderFromRequest(queryStringParameters, client);
    const partner = await getPartnerFromRequest(queryStringParameters, client);
    const image =
      null === store?.image ? "" : process.env.S3_ROUTE + "/" + store.image;
    const clientIP = event?.requestContext?.identity?.sourceIp;
    const token = "";

    /* Creación del linkTrack */
    const linkTrack = await createLinkTrack(
      user,
      store,
      cashback,
      partner,
      clientIP,
      token,
      client
    );

    /* Generar tracker info, para separar la capa lógica, los componentes se juntan en una capa auxiliar que guarda los datos para el tracker */
    const trackerInfo = await generateTrackerInfo(
      user,
      store,
      cashback,
      partner,
      linkTrack,
      client
    );

    /* Get config store for generate link */
    const storeConfigs = await getStoreConfigs(store, client);

    /* Genera el link que se necesita inyectar a la distintas páginas */
    const link = await generateLink(
      user,
      store,
      linkTrack,
      cashback,
      trackerInfo,
      storeConfigs
    );

    /* Logea al usuario */
    await newUserStoreLog(user, store, linkTrack, provider, client);

    const response = {
      statusCode: 200,
      data: {
        usuario: user,
        tienda: store,
        imagen: image,
        link,
      },
    };
    return response;
  } catch (err) {
    return {
      statusCode: err.httpStatus || 500,
      body: JSON.stringify(err),
    };
  }
};

/**
 * Extrae el ID User desde el elemento base64 que está en el request y luego lo busca en la BD
 *
 * @param queryParams
 *
 * @return User
 */
const getUserFromRequest = async (queryParams, client) => {
  try {
    const encodedUserId = queryParams.ru;
    const userId = fromBase64(encodedUserId);
    const user = await getUserById(userId, client);
    return user;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 404,
      message: "Usuario no encontrado.",
      error: err,
    });
  }
};

/**
 * Extrae el ID Store desde el elemento base64 que está en el request y luego lo busca en la BD
 *
 * @param queryParams
 *
 * @return Store
 */
const getStoreFromRequest = async (queryParams, client) => {
  try {
    const encodedStoreId = queryParams.rt;
    const storeId = fromBase64(encodedStoreId);
    const store = await getStoreById(storeId, client);
    return store;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 404,
      message: "Usuario no encontrado.",
      error: err,
    });
  }
};

/**
 * Extrae el ID Cashback desde el elemento base64 que está en el request y luego lo busca en la BD
 *
 * @param queryParams
 * @param Store
 *
 * @return Cashback|null
 */
const getCashbackFromRequest = async (queryParams, store, client) => {
  try {
    const encodedCashbackId = queryParams.rc;
    if (!encodedCashbackId) {
      return null;
    }
    const cashbackId = fromBase64(encodedCashbackId);
    const cashback = await getCashbackByIdAndStore(cashbackId, store, client);
    return cashback;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 404,
      message: "Cashback no encontrado.",
      error: err,
    });
  }
};

/**
 * Extrae el proveedor del cliente desde el elemento base64 que está en el request
 * @param queryParams
 * @param Store
 *
 * @return Cashback|null
 */
const getProviderFromRequest = (queryParams) => {
  const provider = queryParams.rr;
  const providersAvailable = ["web", "extension", "veggo", "fintonic"];
  try {
    if (!provider) return null;
    if (!providersAvailable.includes(provider)) {
      return null;
    }
    return provider.toLowerCase();
  } catch (err) {
    throw new ErrorException({
      httpStatus: 404,
      message: "Provedor no encontrado.",
      error: err,
    });
  }
};

/**
 * Extrae el Partner ID desde el elemento base64 que está en el request y luego lo busca en la BD
 *
 * @param queryParams
 * @param Store
 *
 * @return Cashback|null
 */
const getPartnerFromRequest = async (queryParams) => {
  try {
    const encodedPartnerId = queryParams.rp;
    if (!encodedPartnerId) {
      return null;
    }
    const partnerId = fromBase64(encodedPartnerId);
    const partner = await getPartnerById(partnerId, client);
    return partner;
  } catch (err) {
    throw new ErrorException({
      httpStatus: 404,
      message: "Partner no encontrado.",
      error: err,
    });
  }
};

//ru=NTQ=&rt=MTYx&rr=web
const event = {
  queryStringParameters: {
    ru: "NTQ=",
    rt: "MTYx",
    rc: "",
    rr: "web",
    rp: "",
  },
  requestContext: {
    identity: { sourceIp: "45.185.148.127" },
  },
};

handler(event);
