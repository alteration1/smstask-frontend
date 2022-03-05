import React, { useState, useRef } from 'react'
import { message, Form, Input, Row, Col, Button, Modal } from 'antd'
import CountryPhoneInput, { ConfigProvider } from 'antd-country-phone-input'
import client from '../client'
import moment from 'moment'
import { ReloadOutlined } from '@ant-design/icons'
import en from 'world_countries_lists/data/countries/en/world.json'
import 'antd-country-phone-input/dist/index.css'

const RegisterForm = (props) => {
    const ref = useRef(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false) //open verifivation modal
    const [verified, setVerified] = useState(false) //is phone verified
    const [formValue, setFormValue] = useState({}) //data from register form
    const [code, setCode] = useState(null) //code written from user
    const [sendDateTime, setSendDateTime] = useState(null) //datetime the code was sent from api to phone
    const [disabled, setDisabled] = useState(false) //datetime the code was sent for verification
    const [countAttempts, setAttempt] = useState(0) //count attempts to verify
    const [phone, setPhone] = useState({ short: 'bg' }) //user's phone

    const onFinish = (values) => {
        let userPhone = values.phone
        if (userPhone.phone.charAt(0) === '0') {
            userPhone.phone = userPhone.phone.substring(1)
            setPhone(userPhone)
        }
        values.phone = userPhone.code + userPhone.phone
        setFormValue(values)
        //check is phone was already verified
        client
            .post('/api/check/phone', { phone: phone.code + phone.phone })
            .then(response => {
                if (response.data && response.data.check) {
                    setVerified(true)
                    registerUser(values)
                } else {
                    setOpen(true)
                    setLoading(true)
                    if (!code) {
                        sendCodeToPhone()
                    }
                }
            })
            .catch(error => {
                let errorMessage = 'Some error occured!'
                if (error.response && error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
                message.error(errorMessage, 5);
            })
    }

    //on change phone field
    const onChange = (value) => {
        let phone = value.phone
        phone = phone.replace(/\D/g, '');
        value.phone = phone
        setPhone(value)
    }

    //close verification modal
    const closeModal = () => {
        setOpen(false)
        setLoading(false)
        if (!verified) {
            message.warning('Your registration is not completed because your phone is not verified!');
        }
    }

    //send phone to api -> api will send verification code to phone    
    const sendCodeToPhone = (show = false) => {
        let allowToSend = true;
        const oneMinuteAgo = moment().subtract(60, 'seconds')
        if (sendDateTime && !sendDateTime.isBefore(oneMinuteAgo)) {
            allowToSend = false;
        }
        if (allowToSend && phone) {
            client
                .post('/api/send/code', { phone: phone.code + phone.phone })
                .then(response => {
                    setSendDateTime(moment())
                    setCode(true)
                    if (response.data && response.data.message) {
                        message.success(response.data.message, 5)
                    } else if (response.data && response.data.warning) {
                        message.warning(response.data.warning)
                    }
                })
                .catch(error => {
                    let errorMessage = 'Some error occured!'
                    if (error.response && error.response.data && error.response.data.error) {
                        errorMessage = error.response.data.error;
                    }
                    message.error(errorMessage, 5);
                })
        } else {
            if (show) {
                message.warning('А code has already been sent to your phone.')
            }

        }
    }

    //send code for verification
    const verifyCode = (values) => {
        values.phone = phone.code + phone.phone
        let countMessage = ''
        //count verify attempts
        if (countAttempts === 2) {
            setAttempt(0)
            setDisabled(true)
            countMessage = ' You can try again after one minute.'
            setTimeout(() => {
                setDisabled(false)
            }, 60000);
        } else {
            setAttempt(countAttempts + 1)
        }
        client
            .post('/api/verify/phone', values)
            .then(response => {
                let messageSuccess = 'Your phone has been successfully validated.';
                if (response.data && response.data.message) {
                    messageSuccess = response.data.message;
                }
                message.success(messageSuccess, 5)
                setVerified(true)
                setOpen(false)
                registerUser()
            })
            .catch(error => {
                let errorMessage = 'Some error occured!'
                if (error.response && error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
                message.error(errorMessage + countMessage, 5);
            })
    }

    //send user data for registration
    const registerUser = (values = []) => {
        let form;
        if (values) {
            form = values
        } else {
            form = formValue
        }
        client
            .post('/api/register/user', form)
            .then(response => {
                let messageSuccess = 'You are successfully registered.';
                if (response.data && response.data.message) {
                    messageSuccess = response.data.message;
                }
                message.success(messageSuccess, 5)
                setLoading(false)
            })
            .catch(error => {
                let errorMessage = 'Some error occured!'
                if (error.response && error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
                message.error(errorMessage, 5);
                setLoading(false)
            })
    }

    return (<>
        <Row gutter={[24, 48]} className="register-form">
            <Col span={12} offset={6}>
                <h3>Registration</h3>
            </Col>
        </Row>
        <Row gutter={[24, 48]}>
            <Col span={12} offset={6}>
                <ConfigProvider locale={en}>
                    <Form
                        ref={ref}
                        name="register"
                        onFinish={onFinish}
                        layout="vertical">
                        <Form.Item
                            required
                            name="email"
                            label="Email"
                            rules={[{
                                required: true,
                                message: 'Please input your email!',
                                type: 'email'
                            }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            required
                            label="Phone"
                            name="phone"
                            initialValue={phone}
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your phone',
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || value.phone) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Please input your phone!'));
                                    },
                                }),
                            ]}
                        >
                            <CountryPhoneInput onChange={onChange} value={phone} />
                        </Form.Item>
                        <Form.Item
                            required
                            name="password"
                            label="Password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your password!',
                                },
                            ]}>
                            <Input type={'password'} />
                        </Form.Item>
                        <Button size="large" loading={loading} htmlType="submit" >Next</Button>
                    </Form>
                </ConfigProvider>
            </Col>
        </Row>
        <Modal
            title="Verify phone number"
            centered
            visible={open}
            okButtonProps={{ style: { display: 'none' } }}
            onCancel={closeModal}
            width={1000}
        >
            <Row gutter={[24, 48]}>
                <Col span={24} >
                    We have sent a verification code to your phone, please fill it in the field.
                </Col>
            </Row>
            <Row gutter={[24, 48]}>
                <Col span={24} >
                    <Button
                        onClick={(show) => sendCodeToPhone(true)}
                        icon={<ReloadOutlined />}>Send code again</Button>
                </Col>
            </Row>
            <Row gutter={[24, 48]} className="register-form">
                <Col span={12} >
                    <Form
                        name="code"
                        onFinish={verifyCode}
                        layout="vertical">
                        <Form.Item
                            required
                            name="code"
                            label="Code"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input code!',
                                },
                            ]}>
                            <Input />
                        </Form.Item>
                        <Button
                            disabled={disabled}
                            htmlType="submit">Verify</Button>
                    </Form>
                </Col>
            </Row>
        </Modal>
    </>
    )
}

export default RegisterForm;