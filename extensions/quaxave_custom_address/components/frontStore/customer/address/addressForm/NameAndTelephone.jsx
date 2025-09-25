import React from 'react';
import PropTypes from 'prop-types';
import { Field } from '@components/common/form/Field';
import { _ } from '@evershop/evershop/src/lib/locale/translate';

export function NameAndTelephone({
  input,
  getErrorMessage,
}) {
  // TODO: telephone should have custom validation
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Field
          type="text"
          name={input?.fullNameFullFieldName}
          value={input?.fullName}
          label={input?.fullNameLabel}
          placeholder={input?.telephoneLabel}
          validationRules={
            [
              {
                rule: 'notEmpty',
                message: getErrorMessage(
                  input?.fullNameFormField,
                  _('Full name is required')
                )
              }
            ]
          }
        />
      </div>
      <div>
        <Field
          type="text"
          name={input?.telephoneFullFieldName}
          value={input?.telephone}
          label={input?.telephoneLabel}
          placeholder={input?.telephoneLabel}
          validationRules={
            [
              {
                rule: 'notEmpty',
                message: getErrorMessage(
                  input?.telephoneFormField,
                  _('Telephone is required')
                )
              }
            ]
          }
        />
      </div>
    </div>
  );
}

NameAndTelephone.propTypes = {
  input: PropTypes.shape({
    fullNameLabel: PropTypes.string,
    fullName: PropTypes.string,
    fullNameFormField: PropTypes.string,
    fullNameFullFieldName: PropTypes.string,
    telephoneLabel: PropTypes.string,
    telephone: PropTypes.string,
    telephoneFormField: PropTypes.string,
    telephoneFullFieldName: PropTypes.string,
  }),
  getErrorMessage: PropTypes.func.isRequired,
  isFieldRequired: PropTypes.func.isRequired
};

NameAndTelephone.defaultProps = {
  input: null
};
