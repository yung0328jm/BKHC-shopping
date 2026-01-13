// 商品数据管理工具
const STORAGE_KEY = 'shopping_products'

export const getProducts = () => {
  const products = localStorage.getItem(STORAGE_KEY)
  return products ? JSON.parse(products) : []
}

export const saveProduct = (product) => {
  const products = getProducts()
  const newProduct = {
    ...product,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  products.push(newProduct)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  return newProduct
}

export const deleteProduct = (id) => {
  const products = getProducts()
  const filtered = products.filter(p => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export const updateProduct = (id, updatedProduct) => {
  const products = getProducts()
  const index = products.findIndex(p => p.id === id)
  if (index !== -1) {
    products[index] = { ...products[index], ...updatedProduct }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    return products[index]
  }
  return null
}

