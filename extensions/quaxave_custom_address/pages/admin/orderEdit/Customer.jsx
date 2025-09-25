import PropTypes from 'prop-types';
import React from 'react';
import { Card } from '@components/admin/cms/Card';
import { AddressSummary } from '@components/common/customer/address/AddressSummary';

export default function Customer({
  order: {
    shippingAddress,
    billingAddress,
    customerFullName,
    customerEmail,
    customerUrl
  }
}) {
  return (
    <Card title="Customer">
      <Card.Session>
        {customerUrl && (
          <a
            href={customerUrl}
            className="text-interactive hover:underline block"
          >
            {customerFullName}
          </a>
        )}
        {!customerUrl && <span>{customerEmail} (Guest Checkout)</span>}
      </Card.Session>
      <Card.Session title="Customer information">
        <div>
          <a href={`mailto:${customerEmail}`} className="text-interactive hover:underline">
            {customerEmail}
          </a>
        </div>
      </Card.Session>
      <Card.Session title="Sender information">
        <div>
          <span>{shippingAddress.senderFullName}</span>
        </div>
        <div>
          <a href={`tel:${shippingAddress.senderTelephone}`} className="text-interactive hover:underline">
            {shippingAddress.senderTelephone}
          </a>
        </div>
      </Card.Session>
      <Card.Session title="Shipping Address">
        <AddressSummary address={shippingAddress} />
      </Card.Session>
      <Card.Session title="Billing address">
        <AddressSummary address={billingAddress} />
      </Card.Session>
    </Card>
  );
}

Customer.propTypes = {
  order: PropTypes.shape({
    customerFullName: PropTypes.string.isRequired,
    customerEmail: PropTypes.string.isRequired,
    customerUrl: PropTypes.string,
    shippingAddress: PropTypes.shape({
      senderFullName: PropTypes.string.isRequired,
      senderTelephone: PropTypes.string.isRequired,
      fullName: PropTypes.string.isRequired,
      telephone: PropTypes.string.isRequired,
      address1: PropTypes.string.isRequired,
      city: PropTypes.string.isRequired,
      postcode: PropTypes.string.isRequired,
      province: PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }).isRequired,
      country: PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }).isRequired
    }).isRequired,
    billingAddress: PropTypes.shape({
      fullName: PropTypes.string.isRequired,
      address1: PropTypes.string.isRequired,
      city: PropTypes.string.isRequired,
      postcode: PropTypes.string.isRequired,
      telephone: PropTypes.string.isRequired,
      province: PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }).isRequired,
      country: PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  }).isRequired
};

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    order(uuid: getContextValue("orderId")) {
      customerFullName
      customerEmail
      customerUrl
      shippingAddress {
        senderFullName
        senderTelephone
        fullName
        city
        address1
        address2
        postcode
        telephone
        province {
          code
          name
        }
        country {
          code
          name
        }
      }
      billingAddress {
        fullName
        city
        address1
        address2
        postcode
        telephone
        province {
          code
          name
        }
        country {
          code
          name
        }
      }
    }
  }
`;
