import * as functions from "firebase-functions";

import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';

const app = express();
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, content-type, Accept');

  // Pass to next layer of middleware
  next();
});
app.use(cors());

const BbodyParser = bodyParser.json();

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();
const EmployeeCollection = "Employee";
// const functionURL = "https://us-central1-callable-functions-714e7.cloudfunctions.net/AddEmployee"

export const GetEmployee = async (request: any, response: any) => {
  try {
    const pageNo = request.body?.data?.pageNo || 1;
    const limit =  request.body?.data?.limit || 5;
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
    response.send({
      data: {
        success: true,
        row: EmployeeList,
        pagination
      }
    });
  } catch (err) {
    response.send({
      data: {
        success: false,
        message: "Error:" + err,
      }
    });
  }
}

export const AddEmployee = async (request: any, response: any) => {
  try {
    if (request.body?.data?.Name && request.body?.data?.Email) {
      const query = await admin.firestore().collection(EmployeeCollection);
      const snapshot = await query.where('Email', '==', request.body?.data?.Email).get();
      const count = snapshot.size;
      if (count == 0) {
        const objEmployee = {
          Name: request.body?.data?.Name,
          Email: request.body?.data?.Email,
          CompanyName: request.body?.data?.CompanyName,
          PhoneNumber: request.body?.data?.PhoneNumber
        }
        await query.add(objEmployee);
        response.send({
          data: {
            success: true,
            message: "Employee Added successfully."
          }
        });
      } else {
        response.send({
          data: {
            success: false,
            message: "Employee Already exists with given Email."
          }
        });
      }
    } else {
      response.send({
        data: {
          success: false,
          message: "Please provide Employee details to Add."
        }
      });
    }
  } catch (err) {
    response.send({
      data: {
        success: false,
        message: "Error:" + err
      }
    });
  }
}

app.post('/GetEmployee', BbodyParser, (req, res) => {
  GetEmployee(req, res);
});

app.post('/AddEmployee', BbodyParser, (req, res) => {
  AddEmployee(req, res);
});

exports.employeefunctions = functions.https.onRequest(app);