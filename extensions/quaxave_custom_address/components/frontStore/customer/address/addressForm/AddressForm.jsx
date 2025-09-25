/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import React from 'react';
import { Field } from '@components/common/form/Field';
import Area from '@components/common/Area';
import { Country } from '@components/frontStore/customer/address/addressForm/Country';
import { ProvinceAndPostcode } from '@components/frontStore/customer/address/addressForm/ProvinceAndPostcode';
import { NameAndTelephone } from '@components/frontStore/customer/address/addressForm/NameAndTelephone';
import { _ } from '@evershop/evershop/src/lib/locale/translate';

function isFieldRequired(schema, fieldName) {
  if (schema && Array.isArray(schema.required)) {
    return schema.required.includes(fieldName);
  }

  return false;
}

function getErrorMessage(schema, fieldName, defaultMessage) {
  if (schema && schema.errorMessage) {
    if (schema.errorMessage[fieldName]) {
      return schema.errorMessage[fieldName];
    } else {
      return defaultMessage;
    }
  } else {
    return defaultMessage;
  }
}

export function CustomerAddressForm({
  allowCountries,
  address = {},
  formId = 'customerAddressForm',
  areaId = 'customerAddressForm',
  customerAddressSchema
}) {
  const [selectedCountry, setSelectedCountry] = React.useState(() => {
    const country = address?.country?.code;
    if (!country || !allowCountries.find((c) => c.code === country)) {
      return null;
    } else {
      return country;
    }
  });
  const isReceiverOnly = address?.isReceiverOnly || false

  // Set country again when address changes
  React.useEffect(() => {
    setSelectedCountry(address?.country?.code);
  }, [address]);

  let senderAndReceiverNameAndTelephone = [
    {
      component: { default: NameAndTelephone },
      props: {
        input: {
          fullNameLabel: _('Full name'),
          fullName: address?.fullName,
          fullNameFieldName: 'full_name',
          fullNameFullFieldName: 'address[full_name]',
          telephoneLabel: _('Telephone'),
          telephone: address?.telephone,
          telephoneFieldName: 'telephone',
          telephoneFullFieldName: 'address[telephone]'
        },
        getErrorMessage: (fieldName, defaultMessage) =>
          getErrorMessage(customerAddressSchema, fieldName, defaultMessage),
        isFieldRequired: (fieldName, defaultMessage) =>
          isFieldRequired(customerAddressSchema, fieldName, defaultMessage)
      },
      sortOrder: 10
    }
  ];
  if (!isReceiverOnly) {
    const senderNameAndTelephone = {
      fullNameLabel: _('Sender Full name'),
      fullName: address?.senderFullName,
      fullNameFieldName: 'sender_full_name',
      fullNameFullFieldName: 'address[sender_full_name]',
      telephoneLabel: _('Sender Telephone'),
      telephone: address?.senderTelephone,
      telephoneFieldName: 'sender_telephone',
      telephoneFullFieldName: 'address[sender_telephone]'
    };

    const receiverNameAndTelephone = {
      fullNameLabel: _('Receiver Full name'),
      fullName: address?.fullName,
      fullNameFieldName: 'full_name',
      fullNameFullFieldName: 'address[full_name]',
      telephoneLabel: _('Receiver Telephone'),
      telephone: address?.telephone,
      telephoneFieldName: 'telephone',
      telephoneFullFieldName: 'address[telephone]'
    };
    senderAndReceiverNameAndTelephone = [
      {
        component: { default: NameAndTelephone },
        props: {
          input: senderNameAndTelephone,
          getErrorMessage: (fieldName, defaultMessage) =>
            getErrorMessage(customerAddressSchema, fieldName, defaultMessage),
          isFieldRequired: (fieldName, defaultMessage) =>
            isFieldRequired(customerAddressSchema, fieldName, defaultMessage)
        },
        sortOrder: 10
      },
      {
        component: { default: NameAndTelephone },
        props: {
          input: receiverNameAndTelephone,
          getErrorMessage: (fieldName, defaultMessage) =>
            getErrorMessage(customerAddressSchema, fieldName, defaultMessage),
          isFieldRequired: (fieldName, defaultMessage) =>
            isFieldRequired(customerAddressSchema, fieldName, defaultMessage)
        },
        sortOrder: 15
      }
    ];
  }

  return (
    <Area
      id={areaId}
      coreComponents={[
        ...senderAndReceiverNameAndTelephone,
        {
          component: { default: Field },
          props: {
            type: 'text',
            name: 'address[address_1]',
            value: address?.address1,
            formId,
            label: _('Address'),
            placeholder: _('Address'),
            validationRules: isFieldRequired(customerAddressSchema, 'address_1')
              ? [
                  {
                    rule: 'notEmpty',
                    message: getErrorMessage(
                      customerAddressSchema,
                      'address_1',
                      _('Address is required')
                    )
                  }
                ]
              : []
          },
          sortOrder: 20
        },
        {
          component: { default: Field },
          props: {
            type: 'text',
            name: 'address[city]',
            value: address?.city,
            label: _('City'),
            placeholder: _('City'),
            validationRules: isFieldRequired(customerAddressSchema, 'city')
              ? [
                  {
                    rule: 'notEmpty',
                    message: getErrorMessage(
                      customerAddressSchema,
                      'city',
                      _('City is required')
                    )
                  }
                ]
              : []
          },
          sortOrder: 40
        },
        {
          component: { default: Country },
          props: {
            selectedCountry,
            allowCountries,
            setSelectedCountry,
            fieldName: 'address[country]'
          },
          sortOrder: 50
        },
        {
          component: { default: ProvinceAndPostcode },
          props: {
            address,
            allowCountries,
            selectedCountry,
            getErrorMessage: (fieldName, defaultMessage) =>
              getErrorMessage(customerAddressSchema, fieldName, defaultMessage),
            isFieldRequired: (fieldName, defaultMessage) =>
              isFieldRequired(customerAddressSchema, fieldName, defaultMessage)
          },
          sortOrder: 60
        }
      ]}
    />
  );
}

CustomerAddressForm.propTypes = {
  address: PropTypes.shape({
    isReceiverOnly: PropTypes.bool,
    senderFullName: PropTypes.string,
    senderTelephone: PropTypes.string,
    fullName: PropTypes.string,
    telephone: PropTypes.string,
    country: PropTypes.shape({
      code: PropTypes.string
    }),
    province: PropTypes.shape({
      code: PropTypes.string
    }),
    city: PropTypes.string,
    address1: PropTypes.string,
    postcode: PropTypes.string,
  }),
  allowCountries: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string,
      name: PropTypes.string,
      provinces: PropTypes.arrayOf(
        PropTypes.shape({
          code: PropTypes.string,
          name: PropTypes.string
        })
      )
    })
  ).isRequired,
  areaId: PropTypes.string,
  formId: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  customerAddressSchema: PropTypes.object.isRequired
};

CustomerAddressForm.defaultProps = {
  address: {},
  areaId: 'customerAddressForm',
  formId: 'customerAddressForm'
};
