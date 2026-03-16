// import axios from 'axios';

// const options = {
//   method: 'POST',
//   url: 'https://sandbox.eupago.pt/api/v1.02/mbway/create',
//   headers: {
//     accept: 'application/json',
//     'content-type': 'application/json',
//     Authorization: 'ApiKey demo-937b-bac5-c804-c1f'
//   },
//   data: {
//     payment: {
//       amount: {currency: 'EUR', value: 2},
//       identifier: 'Test',
//       customerPhone: '911234567',
//       countryCode: '+351',
//       callbackUrl: 'https://webhook.site/e87d9e24-9090-499a-91c8-6e72d83035c4'
//     }
//   }
// };

// axios
//   .request(options)
//   .then(res => console.log(res.data))
//   .catch(err => console.error(err));