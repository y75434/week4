Vue.component('pagination', {
    props: ['pages'],
    template: '#pagination',
    data(){
        return{
        };
    },
    methods:{
        changepage(item){
            this.$emit('change', item);
        },
    }
});

new Vue({
    el: '#app',
    data:{
        products: [],//放從ajax傳回來的資料
        pagination: {},//放分頁資料
        tempProduct:{//暫存資料的地方
            imageUrl: [],//照片需用陣列型別
        },
        isNew: false,
        status:{
            fileUploading: false,
        },
        user: {
            token: '',//每次輸入信箱後會顯示隨機碼，會和uuid對應是否符合
            uuid: '11b11a35-2274-4e22-9f5b-dda3fb171d74' //綁定產品列表
        },
    },
    //取得token執行取得全部產品，未取得返回到登入畫面
    created(){
        //使用後台上傳，需經過驗證才能上傳
        this.user.token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        //取不到token就回到登入畫面
        if (this.user.token === ''){
            window.location = 'login.html';
        }
        //執行取得全部產品的行為
        this.getProducts();
    },
    methods:{
        //page預設為第一頁
        getProducts(page = 1){
            const api =`https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/ec/products?page=${page}`;
            //需經過驗證才能上傳(作為預設值做發送)
            axios.defaults.headers.common.Authorization = `Bearer ${this.user.token}`;
            //用ajax取得資料
            axios.get(api).then((response) => {
                this.products = response.data.data;
                this.pagination = response.data.meta.pagination;
            });
        },
        //Modal，isNew 判斷是新增(true)或編輯(false)
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
                    //取得單一產品
                    this.getProduct(item.id);
                    this.isNew = false;
                    break;
                case 'delete':
                    // 目前範本僅有一層物件，因此使用淺拷貝
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
                //若成功，資料寫入tempProduct
                this.tempProduct = res.data.data;
                //顯示該產品詳細資料頁面
                $('#productModal').modal('show');
                //失敗
            }).catch((error) =>{
                console.log(error);
            });
        },
        //更新產品資訊
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
        
        //請看圖片上傳影片教學
        uploadFile(){
            //把檔案內容取出來(第一個檔案)
            const uploadedFile = this.$refs.file.file[0]
            const formData = new FormData();
            formData.append('file', uploadedFile);
            //傳送api的路徑
            const url = `https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/storage`;
            this.status.fileUploading = true;
            //
            axios.post(url, formData, {
                //聲明內容傳遞時需用formData格式，以便後端做判斷
                headers:{
                    'Content-Type': 'multipart/form-data',
                },
                //上傳成功
            }).then((response) => {
                this.status.fileUploading = false;
                if (response.status === 200){
                    //使圖片路徑等於剛上傳的路徑(把圖片路徑存下來)
                    this.tempProduct.imageUrl.push(response.data.data.path);
                }
                //上傳失敗
            }).catch(() => {
                console.log('不可超過 2 MB');
                this.status.fileUploading = false;
            });
        },
        //刪除產品
        delProduct(){
            const url = `https://course-ec-api.hexschool.io/api/${this.user.uuid}/admin/ec/product/${this.tempProduct.id}`;

            axios.delete(url).then(() => {
                $('#delProductModal').modal('hide');// 刪除成功後關閉頁面
                this.getProducts();//重新取得全部資料
            });
        },
    },
})
