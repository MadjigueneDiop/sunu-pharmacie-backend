import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Delivery from "../models/Delivery.js";




export const createOrder = async (req, res) => {

  try {


    const products = JSON.parse(
      req.body.products || "[]"
    );


    const paymentMethod =
      req.body.paymentMethod || "cash";



    if (
      ![
        "cash",
        "wave",
        "orange_money"
      ].includes(paymentMethod)
    ) {

      return res.status(400).json({
        message:"Mode de paiement invalide"
      });

    }



    if(!req.user){

      return res.status(401).json({
        message:"Utilisateur non connecté"
      });

    }




    // récupérer les produits
    const dbProducts = await Product.find({

      _id:{
        $in:products.map(
          p=>p.productId
        )
      }

    });





    let finalTotal = 0;



    let requiresPrescription = false;



    const formattedProducts =
    products.map((p)=>{


      const product =
      dbProducts.find(
        item =>
        item._id.toString()
        === p.productId
      );



      if(!product){

        throw new Error(
          "Produit introuvable"
        );

      }



      if(product.requiresPrescription){

        requiresPrescription=true;

      }



      const quantity =
      Number(p.quantity || 1);



      const price =
      Number(product.price || 0);



      finalTotal +=
      quantity * price;



      return {

        productId:
        product._id,

        quantity,

        price,

        category:
        product.category,

        dosage:
        p.dosage || ""

      };


    });







    // Vérification ordonnance

    if(
      requiresPrescription &&
      !req.file
    ){

      return res.status(400).json({

        message:
        "📄 Ordonnance obligatoire"

      });

    }





    let prescription = null;



    if(req.file){


      prescription={

        url:
        req.file.path ||
        req.file.secure_url,


        status:
        "En attente"

      };


    }







    const order =
    await Order.create({

      userId:req.user._id,


      products:
      formattedProducts,



      total:
      finalTotal,



      paymentMethod,



      paymentStatus:
      "pending",



      paidAt:null,



      requiresPrescription,



      prescription,



      status:
      requiresPrescription
      ?
      "En attente ordonnance"
      :
      "En attente",



      tracking:[

        {

          status:
          "Commande créée",


          by:
          req.user._id,


          role:
          "client"

        }

      ]


    });







    return res.status(201).json({

      message:
      "Commande créée avec succès",


      order


    });




  }

  catch(error){


    console.log(error);


    return res.status(500).json({

      message:error.message

    });


  }

};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("products.productId", "name price image category")
      .lean();

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "prenom nom email")
      .populate("products.productId", "name price image category")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Commande supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    Object.keys(req.body).forEach((key) => {
      order[key] = req.body[key];
    });

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    order.status = status;

    if (!order.tracking) order.tracking = [];

    order.tracking.push({
      status,
      by: req.user._id,
      role: req.user.role,
      date: new Date(),
    });

    if (status === "Livrée") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const validatePrescription = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    if (!order.prescription?.url) {
      return res.status(400).json({ message: "Pas d'ordonnance" });
    }

    order.prescription.status = "Validée";
    order.prescriptionStatus = "Validée";

    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectPrescription = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    order.prescription.status = "Rejetée";
    order.prescriptionStatus = "Rejetée";

    order.status = "Annulée";

    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const validateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId");

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    if (
      order.prescription &&
      order.prescription.status !== "Validée"
    ) {
      return res.status(400).json({
        message: "Ordonnance non validée",
      });
    }

    order.status = "Validée";
    order.deliveryStatus = "en attente"; 
    order.validatedAt = new Date();

    await order.save();

    const exists = await Delivery.findOne({ orderId: order._id });

    if (!exists) {
      await Delivery.create({
        orderId: order._id,
        userId: order.userId._id,
        adresse: order.userId.adresse,
        telephone: order.userId.telephone,
        deliveryStatus: "en attente", 
      });
    }

    return res.json(order);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "prenom nom email")
      .populate("products.productId", "name price image");

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

  
}

export const getPayments = async (req, res) => {
  try {

    const payments = await Order.find({
      paymentMethod: {
        $exists: true
      }
    })

    .populate(
      "userId",
      "prenom nom email telephone adresse"
    )

    .populate(
      "products.productId",
      "name price image category dosage"
    )

    .sort({
      createdAt: 1
    });



    res.status(200).json(payments);



  } catch(error) {

    res.status(500).json({
      message:error.message
    });

  }
};
export const updatePaymentStatus = async(req,res)=>{

try{


const order = await Order.findByIdAndUpdate(

req.params.id,

{
 paymentStatus:req.body.paymentStatus
},

{
 new:true
}

)
.populate("userId","prenom nom email")
.populate(
"products.productId",
"name image category price"
);



if(!order){

return res.status(404).json({

message:"Paiement introuvable"

});

}



res.json(order);



}
catch(error){

res.status(500).json({

message:error.message

});


}

};