// src/pages/Pricing.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const Pricing = () => {
  const navigate = useNavigate()
  useEffect(() => { navigate("/demo", { replace: true }) }, [navigate])
  return null
}

export default Pricing
