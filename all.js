new Vue({
    el: '#app',
    data:{
        products: [],
        pagination: {},
        tempProduct:{
            imageUrl: [],
        },
        isNew: false,
        status:{
            fileUploading: false,
        },
        user: {
            token: '',
            uuid: '11b11a35-2274-4e22-9f5b-dda3fb171d74'
        },
    },
    created(){
        //取得token的cookies
        this.user.token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        if (this.user.token === ''){
            window.location = 'Login.html';
        }
        this.getProducts();
    },
    methods:{
        getProducts(page = 1){
            const api =`https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/ec/products?page=${page}`;
            axios.defaults.headers.common.Authorization = `Bearer ${this.user.token}`;
            
            axios.get(api).then((response) => {
                this.products = response.data.data;
                this.pagination = response.data.meta.pagination;
            });
        },
        //Modal
        openModal(isNew, item){
            switch(isNew){
                case 'new':
                    //新增之前要先清除原有可能暫存的資料
                    this.tempProduct = {
                        imageUrl: [],
                    };
                    this.isNew = true;
                    //開啟Modal
                    $('#productModal').modal('show');
                    break;
                case 'edit':
                    this.getProduct(item.id);
                    this.isNew = false;
                    break;
                case 'delete':
                    this.tempProduct = Object.assign({}, item);
                    //拷貝完畢後開啟Modal
                    $('#delProductModal').modal('show');
                    break;
                default:
                    break;
            }
        },
        //取得單一產品詳細資料
        getProduct(id){
            const api = `https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/ec/product/${id}`;
            axios.get(api).then((res) =>{
                this.tempProduct = res.data.data;
                $('#productModal').modal('show');
            }).catch((error) =>{
                console.log(error);
            });
        },

        updateProduct(){
            let api = `https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/ec/product`;
            let httpMethod = 'post';
            //若不是切換商品則切換成編輯商品API
            if(!this.isNew){
                api = `https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/ec/product/${this.tempProduct.id}`;
                httpMethod = 'patch';
            }
            //預設帶入token
            axios.defaults.headers.common.Authorization = `Bearer ${this.user.token}`;

            axios[httpMethod](api, this.tempProduct).then(() => {
                $('#productModal').modal('hide');//ajax新增成功後隱藏Modal
                this.getProducts();//重新取得全部產品資料
            }).catch((error) => {
                console.log(error)
            });
        },
        
        //教學影音
        uploadFile(){
            const uploadedFile = this.$refs.file.file[0]
            const formData = new FormData();
            formData.append('file', uploadedFile);
            const url = `https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/storage`;
            this.status.fileUploading = true;
            axios.post(url, formData, {
                headers:{
                    'Content-Type': 'multipart/form-data',
                },
            }).then((response) => {
                this.status.fileUploading = false;
                if (response.status === 200){
                    this.tempProduct.imageUrl.push(response.data.data.path);
                }
            }).catch(() => {
                console.log('不可超過 2 MB');
                this.status.fileUploading = false;
            });
        },
        delProduct(){
            const url = `https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/ec/product/${this.tempProduct.id}`;

            axios.delete(url).then(() => {
                $('#delProductModal').modal('hide');
                this.getProducts();//重新取得全部資料
            });
        },
    },
})