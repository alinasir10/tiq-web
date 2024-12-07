import Axios from 'axios'

export const api = Axios.create({
    baseURL: 'https://api.quran.com/api/qdc'
})