import * as functions from "firebase-functions";

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();
const EmployeeCollection = "Employee";
// const functionURL = "https://us-central1-callable-functions-714e7.cloudfunctions.net/AddEmployee"

export const GetEmployee = functions.https.onRequest(async (request, response) => {
  try {
    const pageNo = request.body.pageNo || 1;
    const limit = request.body.limit || 5;
    const offset = (pageNo - 1) * limit;

    const query = await admin.firestore().collection(EmployeeCollection);
    const snapshot = await query.get();
    const count = snapshot.size;

    const EmployeeListSnapshot = await admin.firestore().collection(EmployeeCollection).orderBy('Name').limit(limit).offset(offset).get();
    const EmployeeList: any = [];
    EmployeeListSnapshot.forEach((doc: any) => {
      EmployeeList.push({
        id: doc.id,
        ...doc.data()
      })
    });

    const pagination = {
      totalRecords: count,
      pageNo: pageNo,
      limit: limit,
      totalPages: Math.ceil(count / limit)
    }
    response.send({ success: true, data: EmployeeList, pagination });
  } catch (err) {
    response.send({ success: false, message: "Error:" + err });
  }
});

export const AddEmployee = functions.https.onRequest(async (request, response) => {
  try {
    if (request.body.Name && request.body.Email) {
      const query = await admin.firestore().collection(EmployeeCollection);
      const snapshot = await query.where('Email', '==', request.body.Email).get();
      const count = snapshot.size;
      if (count == 0) {
        const objEmployee = {
          Name: request.body.Name,
          Email: request.body.Email,
          CompanyName: request.body.CompanyName,
          PhoneNumber: request.body.PhoneNumber
        }
        await query.add(objEmployee);
        response.send({ success: true, message: "Employee Added successfully." });
      } else {
        response.send({ success: false, message: "Employee Already exists with given Email." });
      }
    } else {
      response.send({ success: false, message: "Please provide Employee details to Add." });
    }
  } catch (err) {
    response.send({ success: false, message: "Error:" + err });
  }
});