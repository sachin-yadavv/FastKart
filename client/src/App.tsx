import { Toaster } from 'react-hot-toast'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import AppLayout from './pages/AppLayout'
import  Home  from './pages/Home'
import Products from './pages/Products'
import ProductPage from './pages/ProductPage'
import SearchResults from './pages/SearchResults'
import FlashDeals from './pages/FlashDeals'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import OrderTracking from './pages/OrderTracking'
import Addresses from './pages/Addresses'
import ProtectedRoute from './components/ProtectedRoute'

const App = () => {
  return (
    <>
     <Toaster position='top-right' toastOptions={{duration : 3000, style:{
      background: '#1b3022', color : '#fff', fontSize : '14px', borderRadius : '12px'
     }}}/> 
     <Routes>
      {/* auth pages - no navbar/footer */}
      <Route path='/login' element={<Login />} />

      {/* main - pages - with navbar/footer */}
      <Route path='/' element={<AppLayout />} >
         <Route index element ={<Home />} />
         <Route path="products"element ={<Products />} />
         <Route path="products/:id"element ={<ProductPage />} />
         <Route path="search"element ={<SearchResults />} />
         <Route path="deals"element ={<FlashDeals />} />
         <Route element={<ProtectedRoute />} >
          <Route path='checkout' element={<Checkout />}/>
          <Route path='orders' element={<MyOrders />}/>
          <Route path='orders/:id' element={<OrderTracking />}/>
          <Route path='addresses' element={<Addresses />}/>
            
          </Route>
         </Route>
      
      </Routes> 
    </>
  )
}

export default App
