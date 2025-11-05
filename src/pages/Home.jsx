import React from 'react'


const Home = () => {
  return (
   <>

<div className="flex items-center justify-center h-screen relative">
  <h1 class="text-5xl font-bold text-blue-600 relative bottom-[14rem] right-[-14rem]">Welcome to FixMyCity</h1>
  
  <div className="relative bottom-[8rem] left-[-15rem]">
    <h3 className='text-xl mb-5'>Report an Issue</h3>
    <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300 mr-4">CITIZEN</button>
    <button  className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300 mr-4">DEPARTMENTAL</button>
    <button  className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300 mr-4">ADMIN</button>
  </div>
</div>
    </>

  )
}

export default Home