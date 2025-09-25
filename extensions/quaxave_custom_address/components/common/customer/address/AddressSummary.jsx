import React from 'react';
import Area from '@components/common/Area';

export function AddressSummary({ address, isShowSender = false }) {
  let senderAndReceiverNameAndTelephone = [
    {
      component: {
        default: ({ fullName }) => (
          <div className="full-name">{fullName}</div>
        )
      },
      props: {
        fullName: address.fullName
      },
      sortOrder: 10,
      id: 'fullName'
    },
    {
      component: {
        default: ({ telephone }) => (
          <div className="telephone">
            <a href={`tel:${telephone}`} className="text-interactive hover:underline">
              {telephone}
            </a>
          </div>
        )
      },
      props: {
        telephone: address.telephone
      },
      sortOrder: 20,
      id: 'telephone'
    }
  ];

  if (isShowSender && (address.senderFullName && address.senderTelephone)) {
    senderAndReceiverNameAndTelephone = [
    {
      component: {
        default: ({ fullName, telephone }) => (
          <div>
            Sender: {fullName} (<a href={`tel:${telephone}`} className="text-interactive hover:underline">
                {telephone}
              </a>)
          </div>
        )
      },
      props: {
        fullName: address.senderFullName,
        telephone: address.senderTelephone
      },
      sortOrder: 10,
      id: 'senderInfo'
    },
    {
      component: {
        default: ({ fullName, telephone }) => (
          <div>
            Receiver: {fullName} (<a href={`tel:${telephone}`} className="text-interactive hover:underline">
                {telephone}
              </a>)
          </div>
        )
      },
      props: {
        fullName: address.fullName,
        telephone: address.telephone
      },
      sortOrder: 10,
      id: 'receiverInfo'
    }
  ];
  }

  return (
    <Area
      id="addressSummary"
      className="address-summary"
      coreComponents={[
        ...senderAndReceiverNameAndTelephone,
        {
          component: {
            default: ({ address1 }) => (
              <div className="address-one">{address1}</div>
            )
          },
          props: {
            address1: address.address1
          },
          sortOrder: 50,
          id: 'address1'
        },
        {
          component: {
            default: ({ city, province, postcode, country }) => (
              <div className="city-province-postcode">
                <div>{`${postcode}, ${city}`}</div>
                <div>
                  {province && <span>{province.name}, </span>}{' '}
                  <span>{country.name}</span>
                </div>
              </div>
            )
          },
          props: {
            city: address.city,
            province: address.province,
            postcode: address.postcode,
            country: address.country
          },
          sortOrder: 60,
          id: 'cityProvincePostcode'
        }
      ]}
    />
  );
}
