import PropTypes from 'prop-types';
import React from 'react';
import { toast } from 'react-toastify';
import { useCheckoutStepsDispatch } from '@components/common/context/checkoutSteps';
import { _ } from '@evershop/evershop/src/lib/locale/translate';

export function Edit({
  customer,
  addContactInfoApi,
  setEmail,
  loginUrl
}) {
  const { completeStep } = useCheckoutStepsDispatch();

  React.useEffect(() => {
    async function setContactIfLoggedIn() {
      if (!customer) {
        return;
      }
      // Post fetch to set contact info
      const response = await fetch(addContactInfoApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: customer.email
        })
      });
      const data = await response.json();
      if (!data.error) {
        setEmail(data.email);
        await completeStep('contact', data.email);
      } else {
        toast.error(data.error.message);
      }
    }
    setContactIfLoggedIn();
  }, []);

  return (
    <div className="">
      <h4 className="mb-4 mt-4">{_('Contact information')}</h4>
      {!customer && (
        <div className="mb-4">
          <a className="text-interactive hover:underline" href={loginUrl}>
            {_('Please login to continue')}
          </a>
        </div>
      )}
    </div>
  );
}

Edit.propTypes = {
  addContactInfoApi: PropTypes.string.isRequired,
  loginUrl: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    email: PropTypes.string.isRequired
  })
};

Edit.defaultProps = {
  customer: null
};
