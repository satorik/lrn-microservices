import { useState } from 'react'
import Router from 'next/router'
import useRequest from '../hooks/use-request'

export default ({ reqUrl, title }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { doRequest, errors } = useRequest({
    url: reqUrl,
    method: 'post',
    body: {
      email,
      password,
    },
    onSuccess: () => Router.push('/'),
  })

  const onSubmit = async (e) => {
    event.preventDefault()
    doRequest()
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>{title}</h1>
      <div className="form-group">
        <label>Email Address</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-control"
        />
      </div>
      {errors}
      <button className="btn btn-primary">{title}</button>
    </form>
  )
}
