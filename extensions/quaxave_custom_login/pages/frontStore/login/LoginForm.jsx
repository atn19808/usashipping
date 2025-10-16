import PropTypes from 'prop-types';
import React from 'react';
import { Form } from '@components/common/form/Form';
import '@evershop/evershop/src/modules/customer/pages/frontStore/login/LoginForm.scss'
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import Area from '@components/common/Area';

// TODO: consider do this as extension instead

export default function LoginForm({
  action,
  homeUrl,
}) {
  const [error, setError] = React.useState(null);

  return (
    <div className="flex justify-center items-center">
      <div className="login-form flex justify-center items-center">
        <div className="login-form-inner">
          <h1 className="text-center">{_('Login')}</h1>
          {error && <div className="text-critical mb-4">{error}</div>}
          <Form
            id="loginForm"
            action={action}
            isJSON
            method="POST"
            onSuccess={(response) => {
              if (!response.error) {
                window.location.href = homeUrl;
              } else {
                setError(response.error.message);
              }
            }}
            submitBtn={false}
          >
            <Area
              id="loginFormInner"
              coreComponents={[]}
            />
          </Form>
        </div>
      </div>
    </div>
  );
}

LoginForm.propTypes = {
  action: PropTypes.string.isRequired,
  homeUrl: PropTypes.string.isRequired,
  registerUrl: PropTypes.string.isRequired,
  forgotPasswordUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    homeUrl: url(routeId: "homepage")
    action: url(routeId: "customerLoginJson")
    registerUrl: url(routeId: "register")
    forgotPasswordUrl: url(routeId: "resetPasswordPage")
  }
`;
