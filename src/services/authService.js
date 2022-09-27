const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/index.js");

const User = require("../models/User.js");
const { AppError } = require("../utils/appError.js");

const { errorCodes } = require("../utils/errorCodes.js");
const { MONGO_URI } = config;

class AuthService {
    async login(req) {
        const { email, password } = req.body;

        console.log({ email, password });

        const user = await User.findOne(
            { email },
            {
                __v: 0,
                created_at: 0,
                updated_at: 0,
                otp_secret: 0,
                otp_email_secret: 0
            }
        );
        if (!user) throw new AppError(errorCodes["USER_NOT_FOUND"]);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new AppError(errorCodes["INVALID_PASSWORD"]);
        const token = jwt.sign({ id: user._id }, config["JWT_SECRET"], {
            expiresIn: "7 days"
        });

        const {
            _doc: { _id, password: dbPassword, ...userDetail }
        } = user;

        return { token, data: userDetail };
    }

    async signup(req) {
        console.log(req.headers);
        const { email, password } = req.body;
        console.log(req.body);
        const user = await User.exists({ email });
        if (user) throw new AppError(errorCodes["USER_ALREADY_EXIST"]);

        const salt = await bcrypt.genSalt(10);

        const hash = await bcrypt.hash(password, salt);
        req["body"]["password"] = hash;
        const newUser = new User(req["body"]).save();

        return { code: 200, message: "Signup Success. Kindly Proceed with login" };
    }

    async getUserDetailById(req) {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) throw AppError(errorCodes["USER_NOT_FOUND"]);

        return { data: user };
    }

    async fetchall(req, res) {
        var MongoClient = require('mongodb').MongoClient;
        MongoClient.connect(MONGO_URI, function (err, db) {
            if (err) throw err;
            var dbo = db.db("test");
            dbo.collection("courses").find({}).toArray(function (err, result) {
                if (err) throw err;
                console.log(result);
                db.close();
                res.send({
                    code: 200,
                    data: result,
                    message: "API data"
                })
            });
        });
    }
}

module.exports = new AuthService();
