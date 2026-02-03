// Database connection  
app.use('/api/auth', authRoutes);  
app.use('/api/data', dataRoutes);  
app.use('/api/upload', uploadRoutes);

mongoose.connect(process.env.MONGODB_URI, {  
    useNewUrlParser: true,  
    useUnifiedTopology: true  
})  
.then(() => console.log('MongoDB connected'))  
.catch(err => console.log(err));

const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => {  
    console.log(`Server running on port ${PORT}`);
});
