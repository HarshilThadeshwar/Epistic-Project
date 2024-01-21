const Pool = require("pg").Pool;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "8849",
  port: 5432,
});
const path = require("path");



const getCountry = () => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM country where isdeleted = false ORDER BY countryname ASC",
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const getState = () => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT state.stateid, country.countryid, country.countryname , state.statename, country.isdeleted, state.isdeleted  FROM state  INNER JOIN country ON country.countryid = state.countryid  where state.isdeleted = false  AND country.isdeleted = false ",
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const getCity = () => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT city.cityid, city.cityname, state.stateid, country.countryname, state.statename, state.isdeleted,  country.isdeleted, city.isdeleted  FROM city LEFT JOIN country ON country.countryid = city.countryid LEFT JOIN state ON state.stateid = city.stateid WHERE city.isdeleted = false AND state.isdeleted = false AND country.isdeleted = false",
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const createCountry = (body) => {
  return new Promise(function (resolve, reject) {
    const { countryname, countrycode, phonecode } = body;
    pool.query(
      "SELECT * FROM country WHERE countryname = $1 AND isdeleted = true",
      [countryname],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.rows.length > 0) {
            const existingCountry = results.rows[0];
            pool.query(
              "UPDATE country SET isdeleted = false WHERE countryid = $1",
              [existingCountry.countryid],
              (updateError, updateResult) => {
                if (updateError) {
                  reject(updateError);
                } else {
                  resolve(existingCountry);
                }
              }
            );
          } else {
            pool.query(
              "INSERT INTO country (countryname, countrycode, phonecode) VALUES ($1, $2, $3) RETURNING *",
              [countryname, countrycode, phonecode],
              (insertError, insertResult) => {
                if (insertError) {
                  reject(insertError);
                } else {
                  resolve(insertResult.rows[0]);
                }
              }
            );
          }
        }
      }
    );
  });
};

const createState = (body) => {
  return new Promise(function (resolve, reject) {
    const { selectedCountryId, statename } = body;
    pool.query(
      "SELECT * FROM state WHERE statename = $1 AND isdeleted = true",
      [statename],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.rows.length > 0) {
            const existingState = results.rows[0];
            pool.query(
              "UPDATE state SET isdeleted = false WHERE stateid = $1",
              [existingState.stateid],
              (updateError, updateResult) => {
                if (updateError) {
                  reject(updateError);
                } else {
                  resolve(existingState);
                }
              }
            );
          } else {
            pool.query(
              "INSERT INTO state (countryid,statename) VALUES ($1,$2) RETURNING *",
              [selectedCountryId, statename],
              (insertError, insertResult) => {
                if (insertError) {
                  reject(insertError);
                } else {
                  resolve(insertResult.rows[0]);
                }
              }
            );
          }
        }
      }
    );
  });
};

const createCity = (body) => {
  return new Promise(function (resolve, reject) {
    const { selectedStateId, selectedCountryId, cityname } = body;
    pool.query(
      "INSERT INTO city (stateid,countryid,cityname) VALUES ($1, $2 , $3) RETURNING *",
      [selectedStateId, selectedCountryId, cityname],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows[0]);
      }
    );
  });
};

const createToken = (body) => {
  return new Promise(function (resolve, reject) {
    const { username, password } = body;
    pool.query(
      "SELECT * FROM admin WHERE username = $1 AND password = $2",
      [username, password],
      (error, results) => {
        if (error) {

          
          reject(error);
        } else {
          if (results.rows.length === 1) {
            resolve(results.rows[0]);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
};

const deleteCountry = (countryid) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "UPDATE country SET isdeleted = true WHERE countryid = $1",
      [countryid],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve("Country Deleted Successfully");
      }
    );
  });
};

const deleteState = (stateid) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "UPDATE state SET isdeleted = true WHERE stateid = $1",
      [stateid],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve("State Deleted Successfully");
      }
    );
  });
};

const deleteCity = (cityid) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "UPDATE city SET isdeleted = true WHERE cityid = $1",
      [cityid],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve("City Deleted Successfully");
      }
    );
  });
};

const getCountryById = (countryId) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM country WHERE countryid = $1",
      [countryId],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.rows.length === 0) {
            reject({ message: "Country not found" });
          } else {
            resolve(results.rows[0]);
          }
        }
      }
    );
  });
};

const getStateById = (stateId) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM state WHERE stateid = $1",
      [stateId],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.rows.length === 0) {
            reject({ message: "State not found" });
          } else {
            resolve(results.rows[0]);
          }
        }
      }
    );
  });
};

const getCityById = (cityId) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM city WHERE cityid = $1",
      [cityId],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.rows.length === 0) {
            reject({ message: "City not found" });
          } else {
            resolve(results.rows[0]);
          }
        }
      }
    );
  });
};

const updateCountry = (body, countryid) => {
  return new Promise(function (resolve, reject) {
    const { countryname, countrycode, phonecode } = body;
    pool.query(
      "UPDATE country SET countryname = ($2) , countrycode = ($3) , phonecode = ($4) WHERE countryid = ($1)",
      [countryid, countryname, countrycode, phonecode],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve("Country Updated Successfully");
      }
    );
  });
};

const updateState = (body, stateid) => {
  return new Promise(function (resolve, reject) {
    const { selectedCountryId, statename } = body;
    pool.query(
      "UPDATE state SET countryid = ($2) , statename = ($3)  WHERE stateid = ($1)",
      [stateid, selectedCountryId, statename],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve("State Updated Successfully");
      }
    );
  });
};

const updateCity = (body, cityid) => {
  return new Promise(function (resolve, reject) {
    const { selectedCountryId, selectedStateId, cityname } = body;
    pool.query(
      "UPDATE city SET countryid = ($2) , stateid = ($3) , cityname = ($4)  WHERE cityid = ($1)",
      [cityid, selectedCountryId, selectedStateId, cityname],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve("City Updated Successfully");
      }
    );
  });
};

const Countrypagination = (pageNumber, pageSize, filter, sortOrder) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = `
    SELECT * FROM country
    WHERE isdeleted = false
    AND (countryname ILIKE $3 OR countrycode ILIKE $3 OR phonecode ILIKE $3)
    ORDER BY countryname ${sortOrder === "asc" ? "ASC" : "DESC"}
    LIMIT $2 OFFSET $1
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM country
    WHERE isdeleted = false AND (countryname ILIKE $1 OR countrycode ILIKE $1 OR phonecode ILIKE $1)
  `;

  return new Promise(function (resolve, reject) {
    pool.query(query, [offset, pageSize, `%${filter}%`], (error, results) => {
      if (error) {
        reject(error);
      }

      pool.query(countQuery, [`%${filter}%`], (countError, countResults) => {
        if (countError) {
          reject(countError);
        }

        const totalCount = countResults.rows[0].total;
        const data = results.rows;

        resolve({ data, total: totalCount });
      });
    });
  });
};

const Statepagination = (pageNumber, pageSize, filter, sortOrder) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = `
    SELECT state.stateid, country.countryid,country.countryname,state.statename,country.isdeleted, state.isdeleted 
    FROM state INNER JOIN country ON country.countryid = state.countryid 
    WHERE state.isdeleted = false AND country.isdeleted = false
    AND (statename ILIKE $3 OR countryname ILIKE $3)
    ORDER BY statename ${sortOrder === "asc" ? "ASC" : "DESC"}
    LIMIT $2 OFFSET $1
  `;

  const countQuery = `
  SELECT COUNT(*) AS total
  FROM state
  INNER JOIN country ON country.countryid = state.countryid
  WHERE state.isdeleted = false AND country.isdeleted = false
  AND(state.statename ILIKE $1 OR country.countryname ILIKE $1)`;

  return new Promise(function (resolve, reject) {
    pool.query(query, [offset, pageSize, `%${filter}%`], (error, results) => {
      if (error) {
        reject(error);
      }

      pool.query(countQuery, [`%${filter}%`], (countError, countResults) => {
        if (countError) {
          reject(countError);
        }

        const totalCount = countResults.rows[0].total;
        const data = results.rows;

        resolve({ data, total: totalCount });
      });
    });
  });
};

const Citypagination = (pageNumber, pageSize, filter, sortOrder) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = `
    SELECT city.cityid, city.cityname, country.countryname, state.statename, state.isdeleted,  country.isdeleted, city.isdeleted
    FROM city LEFT JOIN country ON country.countryid = city.countryid LEFT JOIN state ON state.stateid = city.stateid 
    WHERE city.isdeleted = false AND state.isdeleted = false AND country.isdeleted = false
    AND (cityname ILIKE $3 OR statename ILIKE $3 OR countryname ILIKE $3)
    ORDER BY cityname ${sortOrder === "asc" ? "ASC" : "DESC"}
    LIMIT $2 OFFSET $1
  `;

  const countQuery = `
  SELECT COUNT(*) AS total
  FROM city
  LEFT JOIN country ON country.countryid = city.countryid
  LEFT JOIN state ON state.stateid = city.stateid
  WHERE state.isdeleted = false AND country.isdeleted = false AND city.isdeleted = false
  AND(city.cityname ILIKE $1 OR state.statename ILIKE $1 OR country.countryname ILIKE $1)`;

  return new Promise(function (resolve, reject) {
    pool.query(query, [offset, pageSize, `%${filter}%`], (error, results) => {
      if (error) {
        reject(error);
      }

      pool.query(countQuery, [`%${filter}%`], (countError, countResults) => {
        if (countError) {
          reject(countError);
        }

        const totalCount = countResults.rows[0].total;
        const data = results.rows;

        resolve({ data, total: totalCount });
      });
    });
  });
};

const getUser = () => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM userdata WHERE isdeleted = false",
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const createUser = (userid, body, profilepicture, resume) => {
  return new Promise(function (resolve, reject) {
    const {
      firstname,
      lastname,
      email,
      phonenumber,
      selectedCountryId,
      selectedStateId,
      selectedCityId,
      address,
    } = body;
    pool.query(
      "SELECT * FROM userdata WHERE email = $1 OR phonenumber = $2",
      [email, phonenumber],
      (checkError, checkResult) => {
        if (checkError) {
          reject(checkError);
        } else if (checkResult.rows.length > 0) {
          const existingUser = checkResult.rows[0];
          if (existingUser.email === email) {
            reject("Email already exists");
          } else {
            reject("Phone number already exists");
          }
        } else {
          pool.query(
            "INSERT INTO userdata (userid, firstname, lastname, email, phonenumber, profilepicture, resume, countryid, stateid, cityid, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
            [
              userid,
              firstname,
              lastname,
              email,
              phonenumber,
              profilepicture,
              resume,
              selectedCountryId,
              selectedStateId,
              selectedCityId,
              address,
            ],
            (insertError, insertResult) => {
              if (insertError) {
                reject(insertError);
              } else {
                resolve(insertResult.rows[0]);
              }
            }
          );
        }
      }
    );
  });
};

const getUserById = (userId) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM userdata where userid = $1",
      [userId],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.rows.length === 0) {
            reject({ message: "User not found" });
          } else {
            resolve(results.rows[0]);
          }
        }
      }
    );
  });
};

const ViewUserById = (userid) => {
  const query = `SELECT u.firstname,u.lastname,u.email,u.phonenumber,u.address,u.profilepicture,
                 u.resume,country.countryname,state.statename,city.cityname FROM userdata as u 
                 JOIN country ON u.countryid = country.countryid 
                 JOIN state ON u.stateid = state.stateid
                 JOIN city ON u.cityid = city.cityid WHERE userid = $1`;

  return new Promise(function (resolve, reject) {
    pool.query(query, [userid], (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(results.rows[0]);
    });
  });
};

const deleteUser = (userid) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "UPDATE userdata SET isdeleted = true WHERE userid = $1",
      [userid],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(`User deleted successfully ${userid}`);
      }
    );
  });
};

const updateUser = (userId, body, profilepicture, resume) => {
  const query = `UPDATE userdata SET firstname = $2, lastname = $3, email = $4, phonenumber = $5,
     profilepicture = $6,resume = $7, countryid = $8, stateid = $9 , cityid = $10, address = $11 WHERE userid = $1`;
  return new Promise(function (resolve, reject) {
    const {
      firstname,
      lastname,
      email,
      phonenumber,
      selectedCountryId,
      selectedStateId,
      selectedCityId,
      address,
    } = body;
    pool.query(
      query,
      [
        userId,
        firstname,
        lastname,
        email,
        phonenumber,
        profilepicture,
        resume,
        selectedCountryId,
        selectedStateId,
        selectedCityId,
        address,
      ],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve("User Updated Successfully");
      }
    );
  });
};

const Userpagination = (pageNumber, pageSize, filter, sortOrder) => {
  const offset = (pageNumber - 1) * pageSize;
  const query = `
    SELECT * FROM userdata
    WHERE isdeleted = false
    AND (firstname ILIKE $1 OR lastname ILIKE $1 OR email ILIKE $1 OR phonenumber ILIKE $1)
    ORDER BY firstname ${sortOrder === "asc" ? "ASC" : "DESC"}
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM userdata
    WHERE isdeleted = false AND (firstname ILIKE $1 OR lastname ILIKE $1 OR email ILIKE $1 OR phonenumber ILIKE $1)
  `;

  return new Promise(function (resolve, reject) {
    pool.query(query, [`%${filter}%`, pageSize, offset], (error, results) => {
      if (error) {
        reject(error);
      }

      pool.query(countQuery, [`%${filter}%`], (countError, countResults) => {
        if (countError) {
          reject(countError);
        }

        const totalCount = countResults.rows[0].total;
        const data = results.rows;

        resolve({ data, total: totalCount });
      });
    });
  });
};

const DownloadResume = (userId, filename) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT resume FROM userdata where userid = $1 AND resume = $2",
      [userId, filename],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.rows.length === 0) {
            reject({ message: "User or resume not found" });
          } else {
            const resumePath = path.join(
              __dirname,
              "upload",
              userId,
              "resume",
              results.rows[0].resume
            );
            resolve(resumePath);
          }
        }
      }
    );
  });
};



module.exports = {
  getCountry,
  getState,
  getCity,
  getUser,
  createToken,
  createCountry,
  createUser,
  createState,
  createCity,
  deleteCountry,
  deleteState,
  deleteCity,
  deleteUser,
  getCountryById,
  getStateById,
  getCityById,
  getUserById,
  updateCountry,
  updateState,
  updateCity,
  updateUser,
  Countrypagination,
  Statepagination,
  Citypagination,
  Userpagination,
  ViewUserById,
  DownloadResume,
};
