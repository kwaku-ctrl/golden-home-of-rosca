/**
 * Supabase Database Utilities
 * Replaces MongoDB models with Supabase PostgreSQL operations
 */

const supabase = require('../config/supabase');

class SupabaseDatabase {
  constructor() {
    this.client = supabase;
  }

  /**
   * Check if Supabase is configured
   */
  isConfigured() {
    return this.client.isConfigured === true;
  }

  /**
   * USER TABLE OPERATIONS
   */

  async getUserByEmail(email) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  async getUserById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createUser(userData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateUser(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getAllUsers(filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client.from('users').select('*').eq('active', true);
    
    if (filters.role) query = query.eq('role', filters.role);
    if (filters.verificationStatus) query = query.eq('verification_status', filters.verificationStatus);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async deleteUser(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * SAVING TABLE OPERATIONS
   */

  async createSaving(savingData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('savings')
      .insert([savingData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getSavingById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('savings')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getSavingsByUser(userId, filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client
      .from('savings')
      .select('*')
      .eq('user', userId);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.accountType) query = query.eq('account_type', filters.accountType);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateSaving(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('savings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteSaving(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('savings').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * LOAN TABLE OPERATIONS
   */

  async createLoan(loanData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('loans')
      .insert([loanData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getLoanById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('loans')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getLoansByUser(userId, filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client
      .from('loans')
      .select('*')
      .eq('user', userId);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.loanType) query = query.eq('loan_type', filters.loanType);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateLoan(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('loans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteLoan(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('loans').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async getAllLoans(filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client.from('loans').select('*');

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.loanType) query = query.eq('loan_type', filters.loanType);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * TRANSACTION TABLE OPERATIONS
   */

  async createTransaction(transactionData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getTransactionById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getTransactionsByUser(userId, filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client
      .from('transactions')
      .select('*')
      .eq('user', userId);

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateTransaction(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTransaction(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('transactions').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async getAllTransactions(filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client.from('transactions').select('*');

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.type) query = query.eq('type', filters.type);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * NOTIFICATION TABLE OPERATIONS
   */

  async createNotification(notificationData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getNotificationById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getNotificationsByUser(userId, filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client
      .from('notifications')
      .select('*')
      .eq('user', userId);

    if (filters.read !== undefined) query = query.eq('read', filters.read);
    if (filters.priority) query = query.eq('priority', filters.priority);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateNotification(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteNotification(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('notifications').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async getAllNotifications(filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client.from('notifications').select('*');

    if (filters.read !== undefined) query = query.eq('read', filters.read);
    if (filters.priority) query = query.eq('priority', filters.priority);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * KYC TABLE OPERATIONS
   */

  async createKyc(kycData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('kyc_documents')
      .insert([kycData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getKycById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('kyc_documents')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getKycByUser(userId) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('kyc_documents')
      .select('*')
      .eq('user', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateKyc(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('kyc_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteKyc(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('kyc_documents').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async getAllKyc(filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client.from('kyc_documents').select('*');

    if (filters.status) query = query.eq('status', filters.status);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * REPAYMENT TABLE OPERATIONS
   */

  async createRepayment(repaymentData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('repayments')
      .insert([repaymentData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getRepaymentById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('repayments')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getRepaymentsByLoan(loanId) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('repayments')
      .select('*')
      .eq('loan', loanId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async getRepaymentsByUser(userId) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('repayments')
      .select('*')
      .eq('user', userId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async updateRepayment(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('repayments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteRepayment(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('repayments').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async getAllRepayments(filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client.from('repayments').select('*');

    if (filters.status) query = query.eq('status', filters.status);

    query = query.order('due_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * BLOG TABLE OPERATIONS
   */

  async createBlog(blogData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('blogs')
      .insert([blogData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getBlogById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getBlogBySlug(slug) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getAllBlogs(filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client.from('blogs').select('*');

    if (filters.published !== undefined) query = query.eq('published', filters.published);

    query = query.order('published_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateBlog(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('blogs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteBlog(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('blogs').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * TESTIMONIAL TABLE OPERATIONS
   */

  async createTestimonial(testimonialData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('testimonials')
      .insert([testimonialData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getTestimonialById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getAllTestimonials(filters = {}) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    let query = this.client.from('testimonials').select('*');

    if (filters.featured !== undefined) query = query.eq('featured', filters.featured);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateTestimonial(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('testimonials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTestimonial(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * ADMIN USER TABLE OPERATIONS
   */

  async createAdminUser(adminUserData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('admin_users')
      .insert([adminUserData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getAdminUserById(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getAdminUserByUserId(userId) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('admin_users')
      .select('*')
      .eq('user', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getAllAdminUsers() {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateAdminUser(id, updateData) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await this.client
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteAdminUser(id) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const { error } = await this.client.from('admin_users').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * PAGINATION HELPER
   */

  async paginatedQuery(tableName, filters = {}, page = 1, limit = 20) {
    if (!this.isConfigured()) throw new Error('Supabase not configured');
    const skip = (page - 1) * limit;

    let countQuery = this.client.from(tableName).select('*', { count: 'exact', head: true });
    let dataQuery = this.client.from(tableName).select('*');

    // Apply filters to both queries
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        countQuery = countQuery.eq(key, value);
        dataQuery = dataQuery.eq(key, value);
      }
    }

    dataQuery = dataQuery.range(skip, skip + limit - 1);

    const [{ count }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery
    ]);

    if (error) throw error;

    return {
      data: data || [],
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    };
  }
}

// Export singleton instance
module.exports = new SupabaseDatabase();
