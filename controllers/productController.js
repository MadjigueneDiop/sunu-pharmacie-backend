import Product from "../models/Product.js";
import History from "../models/History.js";

//AJOUT PRODUIT
export const createProduct = async (req, res) => {
  try {
    const { name, price, quantity, supplierId } = req.body;

    if (!name || !price || !quantity) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const product = await Product.create({
      name,
      price,
      quantity,
      image: req.file ? req.file.filename : "",

      // 🔥 IMPORTANT : supplierId optionnel
      supplierId: supplierId || null,
    });

    res.status(201).json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// MODIFIER PRODUIT
export const updateProduct = async (req, res) => {
  try {
    const { name, price, quantity } = req.body;

    const updateData = {
      name,
      price,
      quantity,
    };

    // 🔥 si image envoyée
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    await History.create({
      user: req.user.id,
      action: "MODIFICATION PRODUIT",
      details: `${product.name} modifié`,
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//SUPPRIMER PRODUIT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    //HISTORIQUE
    await History.create({
      user: req.user.id,
      action: "SUPPRESSION PRODUIT",
      details: `${product.name} supprimé`,
    });

    res.json({ message: "Produit supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET PRODUITS
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📦 APPROVISIONNER STOCK PRODUIT
export const supplyProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    // ➕ mise à jour stock
    product.quantity += Number(quantity);
    await product.save();

    // 📜 historique
    await History.create({
      user: req.user.id,
      action: "APPROVISIONNEMENT",
      details: `${product.name} +${quantity} en stock`,
    });

    // 🧠 AUTO COMMANDE FOURNISSEUR
    if (product.quantity <= 5) {

      // vérifier si une commande existe déjà (évite doublon)
      const existingOrder = await SupplyOrder.findOne({
        "products.productId": product._id,
        status: "Demandé",
      });

      if (!existingOrder) {

        const supplier = await Supplier.findOne();

        if (supplier) {
          await SupplyOrder.create({
            supplierId: supplier._id,
            products: [
              {
                productId: product._id,
                quantity: 20,
              },
            ],
            total: product.price * 20,
            status: "Demandé",
          });
        }
      }
    }

    res.json({
      message: "Stock mis à jour + vérification automatique",
      product,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};