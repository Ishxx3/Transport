from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import base64
import mimetypes
from datetime import datetime
from django.core.files.base import ContentFile
from django.http import JsonResponse
from africa_logistic.models import User, VerificationCode, User2FA, PasswordResetToken, UserConnect, TypeDocumentLegal, DocumentLegal, TransportRequest, RequestDocument, RequestStatusHistory, Vehicle, VehicleDocument, Wallet, WalletTransaction, Notification, Rating, NotificationPreference
from africa_logistic.utils import is_logged_in, is_moderator, send_verify_account_mail, is_admin, is_data_admin, is_pme, is_agriculteur, is_particulier, is_transporteur, send_2FA_mail_with_template, send_reset_password_mail_with_template, is_private_role, is_client, is_transporteur, is_transporteur_or_admin, send_transporter_approval_mail, send_transporter_rejection_mail
from django.http import HttpResponseRedirect
from django.conf import settings
import urllib.parse
import requests
from django.utils import timezone
from django.db.models import Q
from datetime import datetime
from django.core.files.base import ContentFile
from decimal import Decimal




def oauth_login(request):
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.OAUTH_CLIENT_ID,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    return HttpResponseRedirect(url)

def oauth_callback(request):
    code = request.GET.get("code")
    if not code:
        return JsonResponse({"error": "Code OAuth manquant"}, status=400)

    # 1. Échanger le code contre un token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.OAUTH_CLIENT_ID,
        "client_secret": settings.OAUTH_CLIENT_SECRET,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    token_response = requests.post(token_url, data=data).json()

    access_token = token_response.get("access_token")
    if not access_token:
        return JsonResponse({"error": "Impossible d'obtenir le token"}, status=400)

    # 2. Récupérer les infos utilisateur
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    user_info = requests.get(user_info_url, headers=headers).json()

    email = None
    name = user_info.get("name")
    print(user_info)

    if not email:
        return JsonResponse({"error": "Email introuvable"}, status=400)

    # 3. Vérifier si l’utilisateur existe sinon créer
    user, created = User.objects.get_or_create(email=email, defaults={"name": name})

    # Ici tu peux générer un JWT ou une session
    request.session["user_id"] = user.id

    return JsonResponse({
        "message": "Connexion réussie",
        "user": {"id": user.id, "email": user.email, "name": user.name},
        "new_user": created
    })

# Vue d'inscription d'un utilisateur
@csrf_exempt
@require_http_methods(["POST"])
def register_user(request):
    data = json.loads(request.body)
    firstname = data.get('firstname', None)
    lastname = data.get('lastname', None)
    telephone = data.get('telephone', None)
    email = data.get('email', None)
    password = data.get('password', None)
    role = data.get('role', None)
    address = data.get('address', None)
    
    if not role:
        return JsonResponse({'error': 'Le rôle est requis.'}, status=400)
    if not password:
        return JsonResponse({'error': 'Le mot de passe est requis.'}, status=400)
    
    if not email:
        return JsonResponse({'error': 'Email requis.'}, status=400)
    
    
    if email and User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'Un utilisateur avec cet email existe déjà.'}, status=400)
    if telephone and User.objects.filter(telephone=telephone).exists():
        return JsonResponse({'error': 'Un utilisateur avec ce téléphone existe déjà.'}, status=400)
    
    # Pour les transporteurs, is_approved est False par défaut
    is_approved = False
    if role.upper() != 'TRANSPORTEUR':
        is_approved = True  # Les autres rôles sont approuvés automatiquement
    
    user = User(
        firstname=firstname,
        lastname=lastname,
        telephone=telephone,
        email=email,
        role=role,
        address=address,
        password=password,  # temporaire, sera hashé plus bas
        is_approved=is_approved
    )
    try:
        user.full_clean()  # Valide les champs du modèle
        user.save()
        # Créer le wallet automatiquement
        Wallet.objects.get_or_create(user=user)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
    # Si transporteur, permettre l'ajout de véhicules et documents
    vehicles_data = data.get('vehicles', [])
    documents_data = data.get('documents', [])
    
    created_vehicles = []
    created_documents = []
    
    if role == 'TRANSPORTEUR':
        # Créer les véhicules si fournis
        for vehicle_data in vehicles_data:
            try:
                type_veh = vehicle_data.get('type')
                brand = vehicle_data.get('brand')
                model = vehicle_data.get('model')
                plate_number = vehicle_data.get('plate_number')
                capacity_kg = vehicle_data.get('capacity_kg')
                
                if not all([type_veh, brand, model, plate_number, capacity_kg]):
                    continue  # Skip les véhicules incomplets
                
                # Traitement de la photo
                photo_data = vehicle_data.get('photo')
                photo = None
                ext = vehicle_data.get('ext', 'jpg')
                if photo_data:
                    try:
                        if photo_data.startswith("data:image"):
                            format, imgstr = photo_data.split(";base64,")
                            photo = ContentFile(base64.b64decode(imgstr), name=f"vehicle-{plate_number}.{ext}")
                        else:
                            photo = ContentFile(base64.b64decode(photo_data), name=f"vehicle-{plate_number}.{ext}")
                    except:
                        pass
                
                vehicle = Vehicle(
                    owner=user,
                    type=type_veh,
                    brand=brand,
                    model=model,
                    plate_number=plate_number,
                    capacity_kg=capacity_kg,
                    insurance_expiry=vehicle_data.get('insurance_expiry'),
                    inspection_expiry=vehicle_data.get('inspection_expiry'),
                    description=vehicle_data.get('description'),
                    photo=photo,
                )
                vehicle.save()
                created_vehicles.append(vehicle.as_dict())
            except Exception as e:
                # Continuer même si un véhicule échoue
                pass
        
        # Créer les documents légaux si fournis
        for doc_data in documents_data:
            try:
                type_doc_slug = doc_data.get('type_doc')
                file_data = doc_data.get('file')
                description = doc_data.get('description')
                ext = doc_data.get('ext', 'pdf')
                
                if not type_doc_slug or not file_data:
                    continue
                
                try:
                    type_doc = TypeDocumentLegal.objects.get(slug=type_doc_slug)
                except TypeDocumentLegal.DoesNotExist:
                    continue
                
                # Traitement du fichier
                file_obj = None
                if file_data.startswith("data:"):
                    format, file_str = file_data.split(";base64,")
                    now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
                    file_obj = ContentFile(
                        base64.b64decode(file_str),
                        name=f"legal-doc-{user.slug}-{now_str}.{ext}"
                    )
                else:
                    now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
                    file_obj = ContentFile(
                        base64.b64decode(file_data),
                        name=f"legal-doc-{user.slug}-{now_str}.{ext}"
                    )
                
                document = DocumentLegal(
                    user=user,
                    type_doc=type_doc,
                    file=file_obj,
                    description=description
                )
                document.save()
                created_documents.append(document.as_dict())
            except Exception as e:
                # Continuer même si un document échoue
                pass
    
    try:
        vc = VerificationCode(user=user)
        vc.save()
        send_verify_account_mail(user, vc.code)  # Envoyer le mail de vérification avec le token
        
        response_data = {
            'message': 'Veuillez vérifier votre compte en consultant vos mails.',
            'user': user.as_dict()
        }
        
        # Si transporteur, ajouter les informations sur l'approbation
        if role == 'TRANSPORTEUR':
            response_data['message'] = 'Votre demande a été soumise. Un administrateur va vérifier vos documents. Vous recevrez un email une fois votre demande approuvée.'
            response_data['is_approved'] = False
            response_data['vehicles_created'] = len(created_vehicles)
            response_data['documents_created'] = len(created_documents)
        
        return JsonResponse(response_data, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Vue de demande de vérification de compte (renvoyer le code de verification)
@csrf_exempt
@require_http_methods(["POST"])
def resend_verification_code(request):
    data = json.loads(request.body)
    user_slug = data.get('user_slug', None)
    
    if not user_slug:
        return JsonResponse({'error': 'user_slug est requis.'}, status=400)
    
    try:
        user = User.objects.get(slug=user_slug)
        if not user.is_verified:
            # Générer un nouveau code de vérification
            verification_code = VerificationCode(user=user)
            verification_code.save()
            
            # Envoyer le code par email (ici on simule l'envoi)
            send_verify_account_mail(user, verification_code.code)
            
            return JsonResponse({'message': 'Nouveau code de vérification envoyé. Veuillez vérifier votre email.'}, status=201)
        else:
            return JsonResponse({'error': 'Le compte est déjà vérifié.'}, status=400)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)
    
# Vue de vérification de compte via code de verification
@csrf_exempt
@require_http_methods(["PATCH"])
def verify_account(request):
    data = json.loads(request.body)
    user_slug = data.get('user_slug', None)
    code = data.get('code', None)
    
    if not user_slug or not code:
        return JsonResponse({'error': 'user_slug et code sont requis.'}, status=400)
    
    try:
        user = User.objects.get(slug=user_slug)
        verification_code = VerificationCode.objects.filter(user=user, code=code, is_used=False).last()
        
        if verification_code and verification_code.can_be_used():
            # Marquer le code comme utilisé
            verification_code.is_used = True
            verification_code.save()
            
            # Marquer l'utilisateur comme vérifié
            user.is_verified = True
            user.save()
            
            return JsonResponse({'message': 'Compte vérifié avec succès.', 'user': user.as_dict()}, status=200)
        else:
            return JsonResponse({'error': 'Code de vérification invalide ou expiré.'}, status=400)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)

# Vue de connexion d'un utilisateur
@csrf_exempt
@require_http_methods(["POST"])
def login_user(request):
    data = json.loads(request.body)
    email = data.get('email', None)
    telephone = data.get('telephone', None)
    password = data.get('password', None)
    
    if not password:
        return JsonResponse({'error': 'Le mot de passe est requis.'}, status=400)
    
    if not email and not telephone:
        return JsonResponse({'error': 'Email ou téléphone requis.'}, status=400)
    
    try:
        if email:
            user = User.objects.get(email=email)
        else:
            user = User.objects.get(telephone=telephone)
        
        if user.check_password(password):
            # Vérifier si le compte est vérifié par email
            if not user.is_verified:
                return JsonResponse({
                    'error': 'Veuillez vérifier votre compte avant de vous connecter.',
                    'is_not_verified': True,
                    'user_slug': user.slug
                }, status=403)

            # Vérifier si le transporteur est approuvé
            if user.role == 'TRANSPORTEUR' and not user.is_approved:
                return JsonResponse({
                    'error': 'Votre demande est en cours de validation. Vous recevrez un email une fois votre compte approuvé.',
                    'is_pending_approval': True
                }, status=403)
            
            # Générer un token de session (ici on utilise le slug comme token simple)
            user_connect, created = UserConnect.objects.get_or_create(user=user)
            return JsonResponse({'message': 'Connexion réussie.', 'token': user_connect.slug, 'user': user.as_dict(exclude=['password', 'photo'])}, status=200)
        else:
            return JsonResponse({'error': 'Mot de passe incorrect.'}, status=401)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)

# Vue de déconnexion d'un utilisateur
@csrf_exempt
@require_http_methods(["DELETE"])
@is_logged_in
def logout_user(request):
    try:
        user_connect = UserConnect.objects.get(user=request.user)
        user_connect.delete()
        return JsonResponse({'message': 'Déconnexion réussie.'}, status=200)
    except UserConnect.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non connecté.'}, status=400)

# activatin de 2FA
@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def activate_2FA(request):
    user = request.user
    if hasattr(user, 'two_fa') and user.two_fa.is_enabled:
        return JsonResponse({'error': '2FA est déjà activé.'}, status=400)
    
    user_2fa, created = User2FA.objects.get_or_create(user=user)
    user_2fa.is_enabled = True
    user_2fa.save()
    
    return JsonResponse({'message': '2FA activé avec succès.'}, status=200)

# désactivation de 2FA
@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def deactivate_2FA(request):
    user = request.user
    if not hasattr(user, 'two_fa') or not user.two_fa.is_enabled:
        return JsonResponse({'error': '2FA n\'est pas activé.'}, status=400)
    
    user.two_fa.is_enabled = False
    user.two_fa.secret_key = None
    user.two_fa.save()
    
    return JsonResponse({'message': '2FA désactivé avec succès.'}, status=200)

# Vue de connexion avec 2FA (Envoyer le code par mail si l'identifiant et le mot de passe sont corrects puis vérifier le code dans un second endpoint)
@csrf_exempt
@require_http_methods(["POST"])
def send_2FA_after_checking(request):
    data = json.loads(request.body)
    email = data.get('email', None)
    telephone = data.get('telephone', None)
    password = data.get('password', None)
    
    if not password:
        return JsonResponse({'error': 'Le mot de passe est requis.'}, status=400)
    
    if not email and not telephone:
        return JsonResponse({'error': 'Email ou téléphone requis.'}, status=400)
    
    try:
        if email:
            user = User.objects.get(email=email)
        else:
            user = User.objects.get(telephone=telephone)
        
        if user.check_password(password):
            # Vérifier si 2FA est activé
            if hasattr(user, 'two_fa') and user.two_fa.is_enabled:
                # Générer un code de vérification
                verification_code = VerificationCode(user=user)
                verification_code.save()
                
                # Envoyer le code par email (ici on simule l'envoi)
                send_2FA_mail_with_template(user, verification_code.code)
                
                return JsonResponse({'message': 'Code de vérification envoyé. Veuillez vérifier votre email.', 'user_slug': user.slug}, status=200)
            else:
                # Si 2FA n'est pas activé, connecter directement l'utilisateur
                user_connect, created = UserConnect.objects.get_or_create(user=user)
                return JsonResponse({'message': 'Connexion réussie.', 'token': user_connect.slug, 'user': user.as_dict()}, status=200)
        else:
            return JsonResponse({'error': 'Mot de passe incorrect.'}, status=401)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)

# Connexion après vérification de code 2FA

@require_http_methods(["POST"])
@csrf_exempt
def check_login_with_2FA(request):
    data = json.loads(request.body)
    user_slug = data.get('user_slug', None)
    code = data.get('code', None)
    if not user_slug or not code:
        return JsonResponse({'error': 'user_slug et code sont requis.'}, status=400)
    try:
        user = User.objects.get(slug=user_slug)
        verification_code = VerificationCode.objects.filter(user=user, code=code, is_used=False).last()
        
        if verification_code and verification_code.can_be_used():
            # Marquer le code comme utilisé
            verification_code.is_used = True
            verification_code.save()
            
            # Connecter l'utilisateur
            user_connect, created = UserConnect.objects.get_or_create(user=user)
            return JsonResponse({'message': 'Connexion réussie.', 'token': user_connect.slug, 'user': user.as_dict()}, status=200)
        else:
            return JsonResponse({'error': 'Code de vérification invalide ou expiré.'}, status=400)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)

@csrf_exempt
@require_http_methods(["POST"])
def resend_2FA_code(request):
    data = json.loads(request.body)
    user_slug = data.get('user_slug', None)
    
    if not user_slug:
        return JsonResponse({'error': 'user_slug est requis.'}, status=400)
    
    try:
        user = User.objects.get(slug=user_slug)
        if hasattr(user, 'two_fa') and user.two_fa.is_enabled:
            # Générer un nouveau code de vérification
            verification_code = VerificationCode(user=user)
            verification_code.save()
            
            # Envoyer le code par email (ici on simule l'envoi)
            send_2FA_mail_with_template(user, verification_code.code)
            
            return JsonResponse({'message': 'Nouveau code de vérification envoyé. Veuillez vérifier votre email.'}, status=200)
        else:
            return JsonResponse({'error': '2FA n\'est pas activé pour cet utilisateur.'}, status=400)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)

# Vue de vérification du code 2FA
@csrf_exempt
@require_http_methods(["POST"])
def verify_2FA_code(request):
    data = json.loads(request.body)
    user_slug = data.get('user_slug', None)
    code = data.get('code', None)
    
    if not user_slug or not code:
        return JsonResponse({'error': 'user_slug et code sont requis.'}, status=400)
    
    try:
        user = User.objects.get(slug=user_slug)
        verification_code = VerificationCode.objects.filter(user=user, code=code, is_used=False).last()
        
        if verification_code and verification_code.can_be_used():
            # Marquer le code comme utilisé
            verification_code.is_used = True
            verification_code.save()
            
            # Connecter l'utilisateur
            user_connect, created = UserConnect.objects.get_or_create(user=user)
            return JsonResponse({'message': 'Connexion réussie.', 'token': user_connect.slug, 'user': user.as_dict()}, status=200)
        else:
            return JsonResponse({'error': 'Code de vérification invalide ou expiré.'}, status=400)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)

# Vue de demande de réinitialisation de mot de passe
@csrf_exempt
@require_http_methods(["POST"])
def request_password_reset(request):
    data = json.loads(request.body)
    email = data.get('email', None)
    
    if not email:
        return JsonResponse({'error': 'Email est requis.'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        # Générer un code de réinitialisation
        reset_token = PasswordResetToken(user=user)
        reset_token.save()
        
        # Envoyer le code par email
        send_reset_password_mail_with_template(user, reset_token.code)
        
        return JsonResponse({'message': 'Code de réinitialisation envoyé. Veuillez vérifier votre email.'}, status=200)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)
    
# Vue de réinitialisation de mot de passe
@csrf_exempt
@require_http_methods(["PATCH"])
def reset_password(request):
    data = json.loads(request.body)
    code = data.get('code', None)
    new_password = data.get('new_password', None)
    
    if not code or not new_password:
        return JsonResponse({'error': 'Code et nouveau mot de passe sont requis.'}, status=400)
    
    try:
        reset_token = PasswordResetToken.objects.get(code=code, is_used=False)
        
        if reset_token.can_be_used():
            user = reset_token.user
            user.set_password(new_password)
            user.save()
            
            # Marquer le code comme utilisé
            reset_token.is_used = True
            reset_token.save()
            
            return JsonResponse({'message': 'Mot de passe réinitialisé avec succès.'}, status=200)
        else:
            return JsonResponse({'error': 'Code invalide ou expiré.'}, status=400)
    except PasswordResetToken.DoesNotExist:
        return JsonResponse({'error': 'Code invalide.'}, status=400)

# Vue de récupération d'utilisateur connecté
@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_connected_user(request):
    user = request.user
    return JsonResponse({'user': user.as_dict()}, status=200)


# ==================== WALLET (PAIEMENTS / SOLDE) ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_my_wallet(request):
    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    return JsonResponse({
        "message": "Portefeuille récupéré avec succès.",
        "wallet": wallet.as_dict()
    }, status=200)


@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_my_wallet_transactions(request):
    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    txs = wallet.transactions.all().order_by("-created_at")[:100]
    return JsonResponse({
        "message": "Transactions récupérées avec succès.",
        "transactions": [tx.as_dict(include_related=True) for tx in txs]
    }, status=200)


@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def topup_wallet(request):
    """
    Rechargement portefeuille (simulation de paiement côté backend, mais données réelles en DB).
    """
    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    data = json.loads(request.body)
    amount = data.get("amount")
    description = data.get("description", "Rechargement")
    reference = data.get("reference")
    
    try:
        amount_dec = Decimal(str(amount))
    except Exception:
        return JsonResponse({"error": "Montant invalide."}, status=400)
    
    if amount_dec <= 0:
        return JsonResponse({"error": "Le montant doit être supérieur à 0."}, status=400)
    
    wallet.balance = (wallet.balance or Decimal("0.00")) + amount_dec
    wallet.save()
    WalletTransaction.objects.create(
        wallet=wallet,
        tx_type="CREDIT",
        amount=amount_dec,
        description=description,
        reference=reference
    )
    
    return JsonResponse({
        "message": "Portefeuille rechargé avec succès.",
        "wallet": wallet.as_dict()
    }, status=200)


# ==================== NOTIFICATIONS ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_my_notifications(request):
  notifications = Notification.objects.filter(user=request.user).order_by("-created_at")[:50]
  return JsonResponse({
      "message": "Notifications récupérées avec succès.",
      "notifications": [n.as_dict() for n in notifications]
  }, status=200)


@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def mark_notification_read(request, notif_slug):
  try:
      notif = Notification.objects.get(slug=notif_slug, user=request.user)
  except Notification.DoesNotExist:
      return JsonResponse({"error": "Notification non trouvée."}, status=404)
  notif.is_read = True
  notif.save()
  return JsonResponse({"message": "Notification marquée comme lue."}, status=200)


@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def mark_all_notifications_read(request):
  Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
  return JsonResponse({"message": "Toutes les notifications ont été marquées comme lues."}, status=200)

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_data_admin
def get_users_by_data_admin(request):
    users = User.objects.all().order_by('id')
    return JsonResponse({
        "nb": users.count(),
        "users": [u.as_dict() for u in users]
    })

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
@is_data_admin
def alter_user_by_data_admin(request, user_slug):
    try:
        user_pk = User.objects.filter(slug=user_slug).first()
    except User.DoesNotExist:
        return JsonResponse({
            'error': 'Utilisateur non retrouvé'
        }, status=400)
    data = json.loads(request.body)
    firstname = data.get('firstname', None)
    lastname = data.get('lastname', None)
    telephone = data.get('telephone', None)
    role = data.get('role', None)
    address = data.get('address', None)
    photo_data = data.get("photo", None)
    ext = data.get("ext", "jpg")
    
    photo = None
    if photo_data:
        if photo_data.startswith("data:image"):
            format, imgstr = photo_data.split(";base64,")
            photo = ContentFile(base64.b64decode(imgstr), name=f"user-{user_pk.slug}.{ext}")
        else:
            # cas où tu envoies juste le base64 pur
            photo = ContentFile(base64.b64decode(photo_data), name=f"user-{user_pk.slug}.{ext}")
    
    if firstname:
        user_pk.firstname = firstname
    if lastname:
        user_pk.lastname = lastname
    if telephone:
        user_pk.telephone = telephone
    if role:
        user_pk.role = role
    if address:
        user_pk.address = address
    if photo:
        user_pk.photo = photo
    try:
        user_pk.save()
        return JsonResponse({
            'message': "Utilisateur modifié avec succès",
            'user': user_pk.as_dict()
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
@is_data_admin
def desactivate_user_by_data_admin(request, user_slug):
    try:
        user_pk = User.objects.filter(slug=user_slug).first()
    except User.DoesNotExist:
        return JsonResponse({
            'error': 'Utilisateur non retrouvé'
        }, status=400)
    if user_pk.is_blocked:
        return JsonResponse({
            'message': 'Utilisateur déjà blocké'
        }, status=400)
    user_pk.is_blocked = True
    user_pk.save()
    return JsonResponse({
        "message": "Utilisateur blocké avec succès"
    }, status=200)
    
@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
@is_data_admin
def activate_user_by_data_admin(request, user_slug):
    try:
        user_pk = User.objects.filter(slug=user_slug).first()
    except User.DoesNotExist:
        return JsonResponse({
            'error': 'Utilisateur non retrouvé'
        }, status=400)
    if not user_pk.is_blocked:
        return JsonResponse({
            'message': 'Utilisateur déjà déblocké'
        }, status=400)
    user_pk.is_blocked = False
    user_pk.save()
    return JsonResponse({
        "message": "Utilisateur blocké avec succès"
    }, status=200)

@csrf_exempt
@require_http_methods(["DELETE"])
@is_logged_in
@is_data_admin
def delete_user_by_data_admin(request, user_slug):
    try:
        user_pk = User.objects.filter(slug=user_slug).first()
    except User.DoesNotExist:
        return JsonResponse({
            'error': 'Utilisateur non retrouvé'
        }, status=400)
    user_pk.delete()
    return JsonResponse({
        "message": "Utilisateur supprimé avec  succès"
    })

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
@is_data_admin
def restore_deleted_user_by_data_admin(request, user_slug):
    try:
        user_pk = User.objects.all_with_deleted().filter(slug=user_slug).first()
    except User.DoesNotExist:
        return JsonResponse({
            'error': 'Utilisateur non retrouvé'
        }, status=400)
    user_pk.is_active = True
    user_pk.deleted_at = None
    user_pk.save()
    return JsonResponse({
        "message": "Utilisateur restauré avec  succès"
    }, status=200)

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_data_admin
def get_user_info_by_data_admin(request, user_slug):
    try:
        user_pk = User.objects.all_with_deleted().filter(slug=user_slug).first()
    except User.DoesNotExist:
        return JsonResponse({
            'error': 'Utilisateur non retrouvé'
        }, status=400)
    return JsonResponse({
        'message': "Utilisateur retrouvé",
        'user': user_pk.as_dict()
    }, status=200)

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def update_infos(request):
    user = request.user
    data = json.loads(request.body)
    firstname = data.get('firstname', None)
    lastname = data.get('lastname', None)
    telephone = data.get('telephone', None)
    address = data.get('address', None)
    photo_data = data.get("photo", None)
    ext = data.get("ext", "jpg")
    
    photo = None
    if photo_data:
        if photo_data.startswith("data:image"):
            format, imgstr = photo_data.split(";base64,")
            photo = ContentFile(base64.b64decode(imgstr), name=f"user-{user.slug}.{ext}")
        else:
            # cas où tu envoies juste le base64 pur
            photo = ContentFile(base64.b64decode(photo_data), name=f"user-{user.slug}.{ext}")
    
    if firstname:
        user.firstname = firstname
    if lastname:
        user.lastname = lastname
    if telephone:
        if User.objects.filter(telephone=telephone).exclude(id=user.id):
            user.telephone = telephone
        else:
            JsonResponse({
                'error': "Le numéro de téléphone est déjà enregistré. Veuillez le modifié !!!"
            }, status=400)
    if address:
        user.address = address
    if photo:
        user.photo = photo
    try:
        user.save()
        return JsonResponse({
            'message': "Informations modifiées avec succès",
            'user': user.as_dict()
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def change_password(request):
    user = request.user
    data = json.loads(request.body)
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return JsonResponse({'error': 'L\'ancien et le nouveau mot de passe sont requis.'}, status=400)
    
    if user.check_password(old_password):
        user.set_password(new_password)
        user.save()
        return JsonResponse({'message': 'Mot de passe modifié avec succès.'}, status=200)
    else:
        return JsonResponse({'error': 'Ancien mot de passe incorrect.'}, status=400)

@csrf_exempt
@require_http_methods(["GET", "PATCH"])
@is_logged_in
def notification_preferences(request):
    user = request.user
    from africa_logistic.models import NotificationPreference
    prefs, created = NotificationPreference.objects.get_or_create(user=user)
    
    if request.method == "GET":
        return JsonResponse({
            'preferences': prefs.as_dict()
        })
    
    elif request.method == "PATCH":
        data = json.loads(request.body)
        # Update fields dynamically
        for field in [f.name for f in NotificationPreference._meta.fields if isinstance(f, models.BooleanField)]:
            if field in data:
                setattr(prefs, field, data[field])
        prefs.save()
        return JsonResponse({
            'message': 'Préférences mises à jour.',
            'preferences': prefs.as_dict()
        })

@csrf_exempt
@require_http_methods(["POST", "GET"])
@is_logged_in
def rating_view(request):
    from africa_logistic.models import Rating, TransportRequest
    if request.method == "POST":
        data = json.loads(request.body)
        request_slug = data.get('transport_request_slug')
        score = data.get('score')
        comment = data.get('comment')
        
        try:
            transport_request = TransportRequest.objects.get(slug=request_slug, client=request.user)
            if transport_request.status != 'DELIVERED':
                return JsonResponse({'error': 'Vous ne pouvez noter que les demandes livrées.'}, status=400)
            
            rating, created = Rating.objects.update_or_create(
                transport_request=transport_request,
                defaults={'score': score, 'comment': comment}
            )
            return JsonResponse({
                'message': 'Note enregistrée avec succès.',
                'rating': rating.as_dict()
            })
        except TransportRequest.DoesNotExist:
            return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
            
    elif request.method == "GET":
        ratings = Rating.objects.filter(transport_request__client=request.user)
        return JsonResponse({
            'ratings': [r.as_dict() for r in ratings]
        })

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
@is_admin
def associate_tracker(request, request_slug):
    data = json.loads(request.body)
    imei = data.get('tracker_imei')
    
    if not imei:
        return JsonResponse({'error': 'IMEI requis.'}, status=400)
        
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
        transport_request.tracker_imei = imei
        transport_request.save()
        return JsonResponse({
            'message': 'Tracker associé avec succès.',
            'transport_request': transport_request.as_dict()
        })
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)

@csrf_exempt
@require_http_methods(["POST"])
@is_data_admin
def add_type_legal_document_by_data_admin(request):
    data = json.loads(request.body)
    name = data.get('name', None)
    description = data.get('description', "")
    profil = data.get('profil', None)
    if not name:
        JsonResponse({
            'error': "Le nom est obligatoire"
        }, status=400)
    if not profil:
        JsonResponse({
            'error': "Le profil concerné est obligatoire"
        }, status=400)
    try:
        ty = TypeDocumentLegal(
            name=name,
            description=description,
            profil=profil
        )
        ty.full_clean()
        ty.save()
        return JsonResponse({
            'message': "Type de document enregistré avec succès",
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_data_admin
def get_types_legal_document_by_data_admin(request):
    types = TypeDocumentLegal.objects.all().order_by('id')
    return JsonResponse({
        'message': "Types de document récupérés avec succès.",
        'types': [ty.as_dict() for ty in types]
    }, status = 200)

# Endpoint public pour obtenir les types de documents (pour l'inscription)
@csrf_exempt
@require_http_methods(["GET"])
def get_public_document_types(request):
    """
    Endpoint public pour obtenir les types de documents légaux
    Utilisé lors de l'inscription des transporteurs
    """
    types = TypeDocumentLegal.objects.filter(profil='TRANSPORTEUR').order_by('id')
    return JsonResponse({
        'message': "Types de document récupérés avec succès.",
        'types': [ty.as_dict() for ty in types]
    }, status=200)

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
@is_data_admin
def alter_type_legal_document_by_data_admin(request, type_slug):
    try:
        ty = TypeDocumentLegal.objects.filter(slug=type_slug).first()
    except TypeDocumentLegal.DoesNotExist:
        JsonResponse({
            'error': "Type de document non retrouvé"
        }, status=404)
    data = json.loads(request.body)
    name = data.get('name', ty.name)
    description = data.get('description', ty.description)
    profil = data.get('profil', ty.profil)   
    if not name:
        JsonResponse({
            'error': "Le nom est obligatoire"
        }, status=400)
    if not profil:
        JsonResponse({
            'error': "Le profil concerné est obligatoire"
        }, status=400)
    try:
        if name:
            ty.name = name
        if description:
            ty.description = description
        if profil:
            ty.profil = profil
        ty.full_clean()
        ty.save()
        return JsonResponse({
            'message': "Type de document modifié avec succès",
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["DELETE"])
@is_logged_in
@is_data_admin
def delete_type_legal_document_by_data_admin(request, type_slug):
    try:
        ty = TypeDocumentLegal.objects.filter(slug=type_slug).first()
    except TypeDocumentLegal.DoesNotExist:
        JsonResponse({
            'error': "Type de document non retrouvé"
        }, status=404)
    ty.delete()
    return JsonResponse({
            'message': "Type de document supprimé avec succès",
    })

@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def add_legal_document(request):
    """
    Ajouter un document légal
    Accessible à tous les utilisateurs (même transporteurs non approuvés pour l'inscription)
    """
    user = request.user
    # Utilisation de request.FILES et request.POST pour form-data
    file_obj = request.FILES.get("file", None)
    type_doc_slug = request.POST.get("type_doc", None)
    description = request.POST.get("description", None)
    ext = request.POST.get("ext", None)

    if not file_obj or not type_doc_slug:
        return JsonResponse({
            'error': "Le document et son type sont tous deux obligatoires"
        }, status=400)

    # Déterminer l'extension si non fournie
    if not ext and hasattr(file_obj, "content_type"):
        ext = mimetypes.guess_extension(file_obj.content_type) or "dat"
        ext = ext.lstrip(".")
    elif not ext:
        ext = "dat"

    # Renommer le fichier pour le stockage
    now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
    file_obj.name = f"legal-doc-{user.slug}-{now_str}.{ext}"

    try:
        type_doc = TypeDocumentLegal.objects.get(slug=type_doc_slug)
    except TypeDocumentLegal.DoesNotExist:
        return JsonResponse({
            'error': "Type de document non retrouvé"
        }, status=404)
    try:
        docu = DocumentLegal(
            user=user,
            type_doc=type_doc,
            file=file_obj,
            description=description
        )
        docu.save()
        return JsonResponse({
            "message": "Document ajouté avec succès"
        }, status=201)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=400)
        
        
@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def alter_legal_document(request, doc_slug):
    user = request.user

    # Utilisation de request.FILES et request.POST pour form-data
    try:
        data = json.loads(request.body)
        
        
        type_doc_slug = data.get("type_doc", None)
        description = data.get("description", None)
    except:
        type_doc_slug = request.POST.get("type_doc", None)
        description = request.POST.get("description", None)
    file_obj = request.FILES.get("file", None)
    ext = request.POST.get("ext", None)

    document = DocumentLegal.objects.filter(slug=doc_slug).first()
    if not document:
        return JsonResponse({
            'error': "Document non retrouvé"
        }, status=404)

    # Déterminer l'extension si non fournie
    if not ext and file_obj and hasattr(file_obj, "content_type"):
        ext = mimetypes.guess_extension(file_obj.content_type) or "dat"
        ext = ext.lstrip(".")
    elif not ext:
        ext = document.file.name.split('.')[-1] if document.file else "dat"

    # Renommer le fichier pour le stockage
    if file_obj:
        now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
        file_obj.name = f"legal-doc-{user.slug}-{now_str}.{ext}"

    if not type_doc_slug:
        type_doc_slug = document.type_doc.slug if document.type_doc else None

    if not type_doc_slug:
        return JsonResponse({
            'error': "Le type de document est obligatoire"
        }, status=400)

    try:
        type_doc = TypeDocumentLegal.objects.get(slug=type_doc_slug)
    except TypeDocumentLegal.DoesNotExist:
        return JsonResponse({
            'error': "Type de document non retrouvé"
        }, status=404)
    try:
        if file_obj:
            document.file = file_obj
        document.type_doc = type_doc
        if description is not None:
            document.description = description
        document.save()
        return JsonResponse({
            "message": "Document modifié avec succès"
        }, status=200)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=400)

@csrf_exempt
@require_http_methods(["DELETE"])
@is_logged_in
def delete_legal_document(request, doc_slug):
    user = request.user
    document = DocumentLegal.objects.filter(slug=doc_slug).first()
    if not document:
        return JsonResponse({
            'error': "Document non retrouvé"
        }, status=404)
    document.delete()
    return JsonResponse({
        "message": "Document supprimé avec succès"
    }, status=200)

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_private_role
def get_legal_documents_of_user(request, user_slug):
    try:
        user_pk = User.objects.filter(slug=user_slug).first()
    except User.DoesNotExist:
        return JsonResponse({
            'error': 'Utilisateur non retrouvé'
        }, status=400)
    documents = DocumentLegal.objects.filter(user=user_pk).order_by('-id')
    return JsonResponse({
        'message': "Documents récupérés avec succès.",
        'documents': [doc.as_dict() for doc in documents]
    }, status = 200)

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_my_legal_documents(request):
    user = request.user
    documents = DocumentLegal.objects.filter(user=user).order_by('-id')
    return JsonResponse({
        'message': "Vos documents récupérés avec succès.",
        'documents': [doc.as_dict() for doc in documents]
    }, status = 200)

import csv
from django.http import HttpResponse

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def export_client_requests(request):
    """Export client requests to CSV"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="my-requests.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['ID', 'Titre', 'Type', 'Poids', 'Statut', 'Date Collecte', 'Lieu Collecte', 'Lieu Livraison'])
    
    requests = TransportRequest.objects.filter(client=request.user)
    for r in requests:
        writer.writerow([
            r.slug, 
            r.title, 
            r.merchandise_type, 
            r.weight, 
            r.status, 
            r.preferred_pickup_date, 
            r.pickup_address, 
            r.delivery_address
        ])
    
    return response

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_transporteur
def export_transporter_missions(request):
    """Export transporter missions to CSV"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="my-missions.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['ID', 'Titre', 'Client', 'Statut', 'Date Collecte', 'Lieu Collecte', 'Lieu Livraison'])
    
    missions = TransportRequest.objects.filter(assigned_transporter=request.user)
    for m in missions:
        writer.writerow([
            m.slug, 
            m.title, 
            m.client.presentation(), 
            m.status, 
            m.preferred_pickup_date, 
            m.pickup_address, 
            m.delivery_address
        ])
    
    return response

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_admin
def export_admin_report(request):
    """Export all requests report for admin"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="all-requests-report.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['ID', 'Client', 'Transporteur', 'Titre', 'Statut', 'Date Création', 'Prix Estimé'])
    
    requests = TransportRequest.objects.all_with_deleted()
    for r in requests:
        transporter = r.assigned_transporter.presentation() if r.assigned_transporter else "N/A"
        writer.writerow([
            r.slug, 
            r.client.presentation(), 
            transporter, 
            r.title, 
            r.status, 
            r.created_at, 
            r.estimated_price
        ])
    
    return response
    
@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_admin
def export_users_report(request):
    """Export all users report for admin"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="all-users-report.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['ID', 'Nom Complet', 'Email', 'Téléphone', 'Rôle', 'Vérifié', 'Statut', 'Date Création'])
    
    users = User.objects.all_with_deleted()
    for u in users:
        writer.writerow([
            u.slug, 
            u.presentation(), 
            u.email, 
            u.telephone, 
            u.role, 
            "Oui" if u.is_verified else "Non",
            "Actif" if u.is_active else "Inactif", 
            u.created_at
        ])
    
    return response

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_legal_document_details(request, doc_slug):
    user = request.user
    document = DocumentLegal.objects.filter(slug=doc_slug).first()
    if not document:
        return JsonResponse({
            'error': "Document non retrouvé"
        }, status=404)
    if document.user != user and not request.is_private_role:
        return JsonResponse({
            'error': "Vous n'avez pas la permission de voir ce document"
        }, status=403)
    return JsonResponse({
        'message': "Document récupéré avec succès.",
        'document': document.as_dict()
    }, status = 200)
    
@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def validate_document(request, doc_slug):
    user = request.user
    # Vérifier que l'utilisateur est modérateur ou admin
    if user.role not in ['MODERATOR', 'ADMIN', 'DATA ADMIN']:
        return JsonResponse({
            'error': "Vous n'avez pas la permission de valider ce document"
        }, status=403)
    
    document = DocumentLegal.objects.filter(slug=doc_slug).first()
    if not document:
        return JsonResponse({
            'error': "Document non retrouvé"
        }, status=404)
    document.is_valid = True
    document.validated_by = user
    document.validated_at = datetime.now()
    document.save()
    return JsonResponse({
        'message': "Document validé avec succès.",
        'document': document.as_dict()
    }, status = 200)
    
# ==================== CRÉATION DE DEMANDE ====================

@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
@is_client
def create_transport_request(request):
    """
    Créer une nouvelle demande de transport
    Rôles autorisés: PME, PARTICULIER, AGRICULTEUR
    """
    data = json.loads(request.body)
    
    # Champs obligatoires
    title = data.get('title')
    merchandise_description = data.get('merchandise_description')
    weight = data.get('weight')
    volume = data.get('volume')
    pickup_address = data.get('pickup_address')
    pickup_city = data.get('pickup_city')
    delivery_address = data.get('delivery_address')
    delivery_city = data.get('delivery_city')
    preferred_pickup_date = data.get('preferred_pickup_date')
    recipient_name = data.get('recipient_name')
    recipient_phone = data.get('recipient_phone')
    
    # Vérifications
    if not all([title, merchandise_description, weight, volume, pickup_address, 
                pickup_city, delivery_address, delivery_city, preferred_pickup_date,
                recipient_name, recipient_phone]):
        return JsonResponse({'error': 'Tous les champs obligatoires doivent être renseignés.'}, status=400)
    
    # Champs optionnels
    merchandise_type = data.get('merchandise_type', 'GENERAL')
    pickup_coordinates = data.get('pickup_coordinates')
    delivery_coordinates = data.get('delivery_coordinates')
    preferred_delivery_date = data.get('preferred_delivery_date')
    priority = data.get('priority', 'NORMAL')
    special_instructions = data.get('special_instructions')
    estimated_price = data.get('estimated_price')
    is_recurring = data.get('is_recurring', False)
    recurring_frequency = data.get('recurring_frequency')
    recipient_email = data.get('recipient_email')
    
    # Validation de la date
    try:
        pickup_dt = datetime.fromisoformat(preferred_pickup_date.replace('Z', '+00:00'))
        if pickup_dt <= timezone.now():
            return JsonResponse({'error': 'La date de collecte doit être dans le futur.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Format de date invalide.'}, status=400)
    
    # Créer la demande
    try:
        # Vérifier le solde si estimated_price est fourni
        if estimated_price is not None:
            try:
                wallet, _ = Wallet.objects.get_or_create(user=request.user)
                price_dec = Decimal(str(estimated_price))
                if wallet.balance < price_dec:
                    return JsonResponse({'error': 'Solde insuffisant. Veuillez recharger votre portefeuille.'}, status=402)
            except Exception:
                return JsonResponse({'error': 'Prix estimé invalide.'}, status=400)

        transport_request = TransportRequest(
            client=request.user,
            title=title,
            merchandise_type=merchandise_type,
            merchandise_description=merchandise_description,
            weight=weight,
            volume=volume,
            pickup_address=pickup_address,
            pickup_city=pickup_city,
            pickup_coordinates=pickup_coordinates,
            delivery_address=delivery_address,
            delivery_city=delivery_city,
            delivery_coordinates=delivery_coordinates,
            preferred_pickup_date=pickup_dt,
            preferred_delivery_date=preferred_delivery_date,
            priority=priority,
            special_instructions=special_instructions,
            estimated_price=estimated_price,
            is_recurring=is_recurring,
            recurring_frequency=recurring_frequency if is_recurring else None,
            recipient_name=recipient_name,
            recipient_phone=recipient_phone,
            recipient_email=recipient_email,
        )
        transport_request.full_clean()
        transport_request.save()

        # Créer notification pour tous les admins
        admins = User.objects.filter(role__in=["ADMIN", "DATA ADMIN"])
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="Nouvelle demande de transport",
                message=f"{request.user.presentation()} a créé une nouvelle demande: {transport_request.title}",
                type="NEW_REQUEST"
            )

        # Débiter le wallet si estimated_price est fourni
        if estimated_price is not None:
            wallet.balance = (wallet.balance or Decimal("0.00")) - price_dec
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                tx_type="DEBIT",
                amount=price_dec,
                description=f"Paiement demande {transport_request.slug}",
                reference=transport_request.slug
            )
        
        return JsonResponse({
            'message': 'Demande de transport créée avec succès.',
            'transport_request': transport_request.as_dict()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# ==================== LISTE DES DEMANDES ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_transport_requests(request):
    """
    Récupérer la liste des demandes de transport
    - Client: voit seulement ses demandes
    - Transporteur: voit les demandes assignées + disponibles
    - Admin: voit tout
    """
    user = request.user
    
    # Filtrage selon le rôle
    if user.role in ['ADMIN', 'DATA ADMIN']:
        requests = TransportRequest.objects.all()
    elif user.role in ['PME', 'PARTICULIER', 'AGRICULTEUR']:
        requests = TransportRequest.objects.filter(client=user)
    elif user.role == 'TRANSPORTEUR':
        # Vérifier que le transporteur est approuvé
        if not user.is_approved:
            return JsonResponse({'error': 'Vous devez être approuvé par un administrateur pour voir les demandes.'}, status=403)
        # Voir demandes assignées + demandes non assignées
        requests = TransportRequest.objects.filter(
            Q(assigned_transporter=user) | Q(assigned_transporter__isnull=True)
        )
    else:
        return JsonResponse({'error': 'Rôle non autorisé.'}, status=403)
    
    # Filtres optionnels via query params
    status_filter = request.GET.get('status')
    city_filter = request.GET.get('city')
    priority_filter = request.GET.get('priority')
    
    if status_filter:
        requests = requests.filter(status=status_filter)
    if city_filter:
        requests = requests.filter(Q(pickup_city__icontains=city_filter) | Q(delivery_city__icontains=city_filter))
    if priority_filter:
        requests = requests.filter(priority=priority_filter)
    
    # Tri
    requests = requests.order_by('-created_at')
    
    return JsonResponse({
        'message': 'Liste des demandes récupérée avec succès.',
        'transport_requests': [req.as_dict() for req in requests]
    }, status=200)


# ==================== DÉTAILS D'UNE DEMANDE ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_transport_request_detail(request, request_slug):
    """
    Récupérer les détails d'une demande de transport
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    # Vérification des permissions
    user = request.user
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if user.role in ['PME', 'PARTICULIER', 'AGRICULTEUR']:
            if transport_request.client != user:
                return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
        elif user.role == 'TRANSPORTEUR':
            # Vérifier que le transporteur est approuvé
            if not user.is_approved:
                return JsonResponse({'error': 'Vous devez être approuvé par un administrateur.'}, status=403)
            if transport_request.assigned_transporter != user and transport_request.assigned_transporter is not None:
                return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    # Inclure les documents et l'historique
    data = transport_request.as_dict(include_related=True)
    data['documents'] = [doc.as_dict() for doc in transport_request.documents.all()]
    data['status_history'] = [hist.as_dict(include_related=True) for hist in transport_request.status_history.all()]
    
    return JsonResponse({
        'message': 'Détails de la demande récupérés avec succès.',
        'transport_request': data
    }, status=200)


# ==================== MODIFICATION D'UNE DEMANDE ====================

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def update_transport_request(request, request_slug):
    """
    Modifier une demande de transport
    Seul le propriétaire ou un admin peut modifier
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    user = request.user
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if transport_request.client != user:
            return JsonResponse({'error': 'Vous ne pouvez modifier que vos propres demandes.'}, status=403)
    
    # Empêcher modification si déjà livrée ou annulée
    if transport_request.status in ['DELIVERED', 'CANCELLED']:
        return JsonResponse({'error': 'Impossible de modifier une demande terminée.'}, status=400)
    
    data = json.loads(request.body)
    
    # Champs modifiables
    if 'title' in data:
        transport_request.title = data['title']
    if 'merchandise_description' in data:
        transport_request.merchandise_description = data['merchandise_description']
    if 'weight' in data:
        transport_request.weight = data['weight']
    if 'volume' in data:
        transport_request.volume = data['volume']
    if 'pickup_address' in data:
        transport_request.pickup_address = data['pickup_address']
    if 'pickup_city' in data:
        transport_request.pickup_city = data['pickup_city']
    if 'delivery_address' in data:
        transport_request.delivery_address = data['delivery_address']
    if 'delivery_city' in data:
        transport_request.delivery_city = data['delivery_city']
    if 'priority' in data:
        transport_request.priority = data['priority']
    if 'special_instructions' in data:
        transport_request.special_instructions = data['special_instructions']
    if 'estimated_price' in data:
        transport_request.estimated_price = data['estimated_price']
    
    try:
        transport_request.full_clean()
        transport_request.save()
        
        return JsonResponse({
            'message': 'Demande modifiée avec succès.',
            'transport_request': transport_request.as_dict()
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# ==================== SUPPRESSION D'UNE DEMANDE ====================

@csrf_exempt
@require_http_methods(["DELETE"])
@is_logged_in
def delete_transport_request(request, request_slug):
    """
    Supprimer (soft delete) une demande de transport
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    user = request.user
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if transport_request.client != user:
            return JsonResponse({'error': 'Vous ne pouvez supprimer que vos propres demandes.'}, status=403)
    
    # Empêcher suppression si en cours
    if transport_request.status == 'IN_PROGRESS':
        return JsonResponse({'error': 'Impossible de supprimer une demande en cours de livraison.'}, status=400)
    
    transport_request.delete()  # Soft delete
    
    return JsonResponse({
        'message': 'Demande supprimée avec succès.'
    }, status=200)


# ==================== ASSIGNER UN TRANSPORTEUR ====================

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def assign_transporter(request, request_slug):
    """
    Assigner un transporteur à une demande
    Peut être fait par:
    - Admin
    - Le transporteur lui-même (s'auto-assigner)
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    user = request.user
    data = json.loads(request.body)
    transporter_slug = data.get('transporter_slug')
    
    # Si admin, il peut assigner n'importe quel transporteur
    if user.role in ['ADMIN', 'DATA ADMIN']:
        if not transporter_slug:
            return JsonResponse({'error': 'transporter_slug est requis.'}, status=400)
        
        try:
            transporter = User.objects.get(slug=transporter_slug, role='TRANSPORTEUR')
        except User.DoesNotExist:
            return JsonResponse({'error': 'Transporteur non trouvé.'}, status=404)
    
    # Si transporteur, il peut s'auto-assigner (mais doit être approuvé)
    elif user.role == 'TRANSPORTEUR':
        if not user.is_approved:
            return JsonResponse({'error': 'Vous devez être approuvé par un administrateur avant de pouvoir vous assigner à des demandes.'}, status=403)
        transporter = user
    else:
        return JsonResponse({'error': 'Seul un admin ou un transporteur peut assigner.'}, status=403)
    
    # Vérifier si pas déjà assigné
    if transport_request.assigned_transporter:
        return JsonResponse({'error': 'Un transporteur est déjà assigné à cette demande.'}, status=400)
    
    # Assigner
    old_status = transport_request.status
    transport_request.assigned_transporter = transporter
    transport_request.status = 'ASSIGNED'
    transport_request.save()
    
    # Créer historique
    RequestStatusHistory.objects.create(
        transport_request=transport_request,
        old_status=old_status,
        new_status='ASSIGNED',
        changed_by=user,
        comment=f"Transporteur assigné: {transporter.presentation()}"
    )
    
    # Notification pour le transporteur assigné
    Notification.objects.create(
        user=transporter,
        title="Nouvelle mission assignée",
        message=f"Une nouvelle mission vous a été assignée: {transport_request.title}",
        type="ASSIGNED_MISSION"
    )

    return JsonResponse({
        'message': 'Transporteur assigné avec succès.',
        'transport_request': transport_request.as_dict()
    }, status=200)


# ==================== CHANGER LE STATUT ====================

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def update_status(request, request_slug):
    """
    Mettre à jour le statut d'une demande
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    user = request.user
    data = json.loads(request.body)
    new_status = data.get('status')
    comment = data.get('comment', '')
    
    if not new_status:
        return JsonResponse({'error': 'Le nouveau statut est requis.'}, status=400)
    
    # Vérifier les permissions selon le rôle
    if user.role in ['ADMIN', 'DATA ADMIN']:
        # Admin peut changer n'importe quel statut
        pass
    elif user.role == 'TRANSPORTEUR':
        # Vérifier que le transporteur est approuvé
        if not user.is_approved:
            return JsonResponse({'error': 'Vous devez être approuvé par un administrateur.'}, status=403)
        # Transporteur ne peut changer que s'il est assigné
        if transport_request.assigned_transporter != user:
            return JsonResponse({'error': 'Vous n\'êtes pas assigné à cette demande.'}, status=403)
        # Et seulement vers IN_PROGRESS ou DELIVERED
        if new_status not in ['IN_PROGRESS', 'DELIVERED']:
            return JsonResponse({'error': 'Vous ne pouvez changer le statut que vers IN_PROGRESS ou DELIVERED.'}, status=403)
    else:
        return JsonResponse({'error': 'Seul un admin ou le transporteur assigné peut changer le statut.'}, status=403)
    
    # Valider les transitions de statut
    current_status = transport_request.status
    allowed_transitions = {
        'PENDING': ['OFFERS_RECEIVED', 'ASSIGNED', 'CANCELLED'],
        'OFFERS_RECEIVED': ['ASSIGNED', 'PENDING', 'CANCELLED'],
        'ASSIGNED': ['IN_PROGRESS', 'CANCELLED'],
        'IN_PROGRESS': ['DELIVERED', 'CANCELLED'],
        'DELIVERED': [],
        'CANCELLED': []
    }
    
    if new_status not in allowed_transitions.get(current_status, []):
        return JsonResponse({
            'error': f"Transition non autorisée de '{current_status}' vers '{new_status}'"
        }, status=400)
    
    # Mettre à jour le statut
    old_status = transport_request.status
    transport_request.status = new_status
    transport_request.save()
    
    # Créer historique
    RequestStatusHistory.objects.create(
        transport_request=transport_request,
        old_status=old_status,
        new_status=new_status,
        changed_by=user,
        comment=comment
    )
    
    return JsonResponse({
        'message': 'Statut mis à jour avec succès.',
        'transport_request': transport_request.as_dict()
    }, status=200)


# ==================== UPLOAD DE DOCUMENT ====================

@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def upload_document(request, request_slug):
    """
    Uploader un document pour une demande de transport
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    user = request.user
    
    # Vérifier les permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if user.role in ['PME', 'PARTICULIER', 'AGRICULTEUR']:
            if transport_request.client != user:
                return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
        elif user.role == 'TRANSPORTEUR':
            if transport_request.assigned_transporter != user:
                return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    documents = transport_request.documents.all()
    
    return JsonResponse({
        'message': 'Documents récupérés avec succès.',
        'documents': [doc.as_dict() for doc in documents]
    }, status=200)


# ==================== SUPPRIMER UN DOCUMENT ====================

@csrf_exempt
@require_http_methods(["DELETE"])
@is_logged_in
def delete_document(request, document_slug):
    """
    Supprimer un document
    """
    try:
        document = RequestDocument.objects.get(slug=document_slug)
    except RequestDocument.DoesNotExist:
        return JsonResponse({'error': 'Document non trouvé.'}, status=404)
    
    user = request.user
    
    # Vérifier les permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if document.transport_request.client != user:
            return JsonResponse({'error': 'Vous ne pouvez supprimer que vos propres documents.'}, status=403)
    
    document.delete()
    
    return JsonResponse({
        'message': 'Document supprimé avec succès.'
    }, status=200)


# ==================== HISTORIQUE DES STATUTS ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_status_history(request, request_slug):
    """
    Récupérer l'historique des changements de statut
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    user = request.user
    
    # Vérifier les permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if user.role in ['PME', 'PARTICULIER', 'AGRICULTEUR']:
            if transport_request.client != user:
                return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
        elif user.role == 'TRANSPORTEUR':
            if transport_request.assigned_transporter != user:
                return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    history = transport_request.status_history.all()
    
    return JsonResponse({
        'message': 'Historique récupéré avec succès.',
        'history': [h.as_dict(include_related=True) for h in history]
    }, status=200)


# ==================== MES DEMANDES (CLIENT) ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_my_requests(request):
    """
    Récupérer les demandes de l'utilisateur connecté
    """
    user = request.user
    requests = TransportRequest.objects.filter(client=user).order_by('-created_at')
    
    return JsonResponse({
        'message': 'Vos demandes récupérées avec succès.',
        'transport_requests': [req.as_dict() for req in requests]
    }, status=200)


# ==================== DEMANDES ASSIGNÉES (TRANSPORTEUR) ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_transporteur
def get_my_assigned_requests(request):
    """
    Récupérer les demandes assignées au transporteur connecté
    """
    user = request.user
    
    # Vérifier que le transporteur est approuvé
    if not user.is_approved:
        return JsonResponse({'error': 'Vous devez être approuvé par un administrateur.'}, status=403)
    
    requests = TransportRequest.objects.filter(assigned_transporter=user).order_by('-created_at')
    
    return JsonResponse({
        'message': 'Vos demandes assignées récupérées avec succès.',
        'transport_requests': [req.as_dict() for req in requests]
    }, status=200)


# ==================== DEMANDES DISPONIBLES (TRANSPORTEUR) ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_transporteur
def get_available_requests(request):
    """
    Récupérer les demandes disponibles (non assignées) pour les transporteurs
    """
    user = request.user
    
    # Vérifier que le transporteur est approuvé
    if not user.is_approved:
        return JsonResponse({'error': 'Vous devez être approuvé par un administrateur.'}, status=403)
    
    requests = TransportRequest.objects.filter(
        assigned_transporter__isnull=True,
        status__in=['PENDING', 'OFFERS_RECEIVED']
    ).order_by('-created_at')
    
    # Filtres optionnels
    city_filter = request.GET.get('city')
    priority_filter = request.GET.get('priority')
    
    if city_filter:
        requests = requests.filter(
            Q(pickup_city__icontains=city_filter) | Q(delivery_city__icontains=city_filter)
        )
    if priority_filter:
        requests = requests.filter(priority=priority_filter)
    
    return JsonResponse({
        'message': 'Demandes disponibles récupérées avec succès.',
        'transport_requests': [req.as_dict() for req in requests]
    }, status=200)


# ==================== STATISTIQUES (ADMIN) ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_admin
def get_statistics(request):
    """
    Récupérer les statistiques des demandes de transport
    Réservé aux admins
    """
    total_requests = TransportRequest.objects.count()
    
    # Statistiques par statut
    stats_by_status = {}
    for status_code, status_label in TransportRequest.STATUS_CHOICES:
        count = TransportRequest.objects.filter(status=status_code).count()
        stats_by_status[status_code] = {
            'label': status_label,
            'count': count
        }
    
    # Statistiques par priorité
    stats_by_priority = {}
    for priority_code, priority_label in TransportRequest.PRIORITY_LEVELS:
        count = TransportRequest.objects.filter(priority=priority_code).count()
        stats_by_priority[priority_code] = {
            'label': priority_label,
            'count': count
        }
    
    # Statistiques par type de marchandise
    stats_by_merchandise = {}
    for merch_code, merch_label in TransportRequest.MERCHANDISE_TYPES:
        count = TransportRequest.objects.filter(merchandise_type=merch_code).count()
        stats_by_merchandise[merch_code] = {
            'label': merch_label,
            'count': count
        }
    
    # Demandes ce mois
    from datetime import date
    now = timezone.now()
    this_month = TransportRequest.objects.filter(
        created_at__year=now.year,
        created_at__month=now.month
    ).count()
    
    return JsonResponse({
        'message': 'Statistiques récupérées avec succès.',
        'statistics': {
            'total_requests': total_requests,
            'this_month': this_month,
            'by_status': stats_by_status,
            'by_priority': stats_by_priority,
            'by_merchandise_type': stats_by_merchandise
        }
    }, status=200)


@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
@is_admin
def get_admin_kpis(request):
    """
    Récupérer les KPIs globaux pour le dashboard admin
    """
    from africa_logistic.models import User, TransportRequest
    from django.db.models import Sum
    
    # Counts by role
    total_clients = User.objects.filter(role__in=['PME', 'PARTICULIER', 'AGRICULTEUR', 'CLIENT']).count()
    total_transporters = User.objects.filter(role__iexact='TRANSPORTEUR').count()
    total_moderators = User.objects.filter(role__iexact='MODERATOR').count()
    
    # Request stats
    total_requests = TransportRequest.objects.count()
    completed_requests = TransportRequest.objects.filter(status__iexact='DELIVERED').count()
    pending_requests = TransportRequest.objects.filter(status__iexact='PENDING').count()
    in_progress_requests = TransportRequest.objects.filter(status__in=['ASSIGNED', 'IN_PROGRESS', 'assigned', 'in_progress']).count()
    
    # Revenue (using estimated_price as fallback since no platform_commission field yet)
    # In a real app, you'd have a commission field
    total_revenue = TransportRequest.objects.filter(status__iexact='DELIVERED').aggregate(total=Sum('estimated_price'))['total'] or 0
    
    # Delivery rate
    delivery_rate = 0
    if total_requests > 0:
        delivery_rate = (completed_requests / total_requests) * 100
    
    # Today's new requests
    today = timezone.now().date()
    today_requests = TransportRequest.objects.filter(created_at__date=today).count()
    
    # Wallets info
    total_client_balance = Wallet.objects.filter(user__role__in=['PME', 'PARTICULIER', 'AGRICULTEUR', 'CLIENT']).aggregate(total=Sum('balance'))['total'] or 0
    total_transporter_balance = Wallet.objects.filter(user__role__iexact='TRANSPORTEUR').aggregate(total=Sum('balance'))['total'] or 0
    
    return JsonResponse({
        'total_clients': total_clients,
        'total_transporters': total_transporters,
        'total_moderators': total_moderators,
        'total_requests': total_requests,
        'completed_requests': completed_requests,
        'pending_requests': pending_requests,
        'in_progress_requests': in_progress_requests,
        'total_revenue': float(total_revenue),
        'open_disputes': 0,  
        'total_client_balance': float(total_client_balance),
        'total_transporter_balance': float(total_transporter_balance),
        'today_transactions': today_requests,  
        'delivery_rate': f"{delivery_rate:.1f}"
    }, status=200)


# ==================== RESTAURER DEMANDE SUPPRIMÉE (DATA ADMIN) ====================

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
@is_data_admin
def restore_deleted_request(request, request_slug):
    """
    Restaurer une demande supprimée (soft deleted)
    Réservé aux DATA ADMIN
    """
    try:
        transport_request = TransportRequest.objects.all_with_deleted().filter(slug=request_slug).first()
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    if not transport_request:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    if transport_request.is_active:
        return JsonResponse({'error': 'La demande n\'est pas supprimée.'}, status=400)
    
    transport_request.is_active = True
    transport_request.deleted_at = None
    transport_request.save()
    
    return JsonResponse({
        'message': 'Demande restaurée avec succès.',
        'transport_request': transport_request.as_dict()
    }, status=200)


# ==================== LISTE TOUTES LES DEMANDES (ADMIN/DATA ADMIN) ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_all_requests_by_admin(request):
    """
    Récupérer toutes les demandes (y compris supprimées)
    Réservé aux ADMIN et DATA ADMIN
    """
    user = request.user
    
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        return JsonResponse({'error': 'Accès réservé aux administrateurs.'}, status=403)
    
    include_deleted = request.GET.get('include_deleted', 'false').lower() == 'true'
    
    if include_deleted:
        requests = TransportRequest.objects.all_with_deleted().order_by('-created_at')
    else:
        requests = TransportRequest.objects.all().order_by('-created_at')
    
    # Filtres
    status_filter = request.GET.get('status')
    client_slug = request.GET.get('client_slug')
    transporter_slug = request.GET.get('transporter_slug')
    
    if status_filter:
        requests = requests.filter(status=status_filter)
    if client_slug:
        requests = requests.filter(client__slug=client_slug)
    if transporter_slug:
        requests = requests.filter(assigned_transporter__slug=transporter_slug)
    
    return JsonResponse({
        'message': 'Toutes les demandes récupérées avec succès.',
        'transport_requests': [req.as_dict() for req in requests]
    }, status=200)


# ==================== ANNULER UNE DEMANDE ====================

@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def cancel_request(request, request_slug):
    """
    Annuler une demande de transport
    Le client peut annuler sa demande si elle n'est pas encore IN_PROGRESS
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    user = request.user
    
    # Vérifier les permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if transport_request.client != user:
            return JsonResponse({'error': 'Vous ne pouvez annuler que vos propres demandes.'}, status=403)
    
    # Vérifier le statut actuel
    if transport_request.status in ['DELIVERED', 'CANCELLED']:
        return JsonResponse({'error': 'Cette demande est déjà terminée.'}, status=400)
    
    if transport_request.status == 'IN_PROGRESS':
        return JsonResponse({'error': 'Impossible d\'annuler une demande en cours de livraison.'}, status=400)
    
    data = json.loads(request.body)
    reason = data.get('reason', 'Annulée par le client')
    
    # Changer le statut
    old_status = transport_request.status
    transport_request.status = 'CANCELLED'
    transport_request.save()
    
    # Créer historique
    RequestStatusHistory.objects.create(
        transport_request=transport_request,
        old_status=old_status,
        new_status='CANCELLED',
        changed_by=user,
        comment=reason
    )
    
    return JsonResponse({
        'message': 'Demande annulée avec succès.',
        'transport_request': transport_request.as_dict()
    }, status=200)


# ==================== UPLOADER UN DOCUMENT ====================

@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def upload_request_document(request, request_slug):
    """
    Uploader un document pour une demande
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)

    user = request.user
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if transport_request.client != user:
            return JsonResponse({'error': 'Vous ne pouvez uploader des documents que sur vos propres demandes.'}, status=403)
    
    data = json.loads(request.body)
    file_data = data.get("file")
    document_type = data.get("document_type", "OTHER")
    description = data.get("description", "")
    ext = data.get("ext", None)
    
    # Extraire l'extension du MIME type si nécessaire
    if not ext and file_data and file_data.startswith("data:"):
        mime_type = file_data.split(";")[0][5:]
        ext = mimetypes.guess_extension(mime_type) or "dat"
        ext = ext.lstrip(".")
    elif not ext:
        ext = "dat"
    
    # Convertir base64 en fichier
    document_file = None
    if file_data:
        if file_data.startswith("data:"):
            format, file_str = file_data.split(";base64,")
            now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
            document_file = ContentFile(
                base64.b64decode(file_str),
                name=f"transport-doc-{transport_request.slug}-{now_str}.{ext}"
            )
        else:
            document_file = ContentFile(
                base64.b64decode(file_data),
                name=f"transport-doc-{transport_request.slug}.{ext}"
            )
    
    if not document_file:
        return JsonResponse({'error': 'Le fichier est requis.'}, status=400)
    
    try:
        doc = RequestDocument(
            transport_request=transport_request,
            document_type=document_type,
            file=document_file,
            description=description
        )
        doc.save()
        
        return JsonResponse({
            'message': 'Document uploadé avec succès.',
            'document': doc.as_dict()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# ==================== LISTE DES DOCUMENTS ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_request_documents(request, request_slug):
    """
    Récupérer les documents d'une demande
    """
    try:
        transport_request = TransportRequest.objects.get(slug=request_slug)
    except TransportRequest.DoesNotExist:
        return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
    
    user = request.user
    
    # Vérifier les permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if transport_request.client != user:
            return JsonResponse({'error': 'Vous ne pouvez uploader des documents que sur vos propres demandes.'}, status=403)


# ==================== GESTION DES VÉHICULES ====================

@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def create_vehicle(request):
    """
    Créer un nouveau véhicule
    Réservé aux transporteurs (approuvés ou non, pour permettre l'ajout lors de l'inscription)
    """
    user = request.user
    
    # Vérifier que c'est un transporteur
    if user.role != 'TRANSPORTEUR':
        return JsonResponse({'error': 'Seuls les transporteurs peuvent créer des véhicules.'}, status=403)
    
    data = json.loads(request.body)
    
    # Champs obligatoires
    type = data.get('type')
    brand = data.get('brand')
    model = data.get('model')
    plate_number = data.get('plate_number')
    capacity_kg = data.get('capacity_kg')
    
    if not all([type, brand, model, plate_number, capacity_kg]):
        return JsonResponse({'error': 'Tous les champs obligatoires doivent être renseignés.'}, status=400)
    
    # Vérifier si le numéro de plaque existe déjà
    if Vehicle.objects.filter(plate_number=plate_number).exists():
        return JsonResponse({'error': 'Un véhicule avec ce numéro de plaque existe déjà.'}, status=400)
    
    # Champs optionnels
    insurance_expiry = data.get('insurance_expiry') or None
    inspection_expiry = data.get('inspection_expiry') or None
    description = data.get('description') or None
    photo_data = data.get('photo')
    ext = data.get('ext', 'jpg')
    
    # Traitement de la photo
    photo = None
    if photo_data:
        try:
            if photo_data.startswith("data:image"):
                format, imgstr = photo_data.split(";base64,")
                photo = ContentFile(base64.b64decode(imgstr), name=f"vehicle-{plate_number}.{ext}")
            else:
                photo = ContentFile(base64.b64decode(photo_data), name=f"vehicle-{plate_number}.{ext}")
        except Exception as e:
            return JsonResponse({'error': f'Erreur lors du traitement de la photo: {str(e)}'}, status=400)
    
    try:
        vehicle = Vehicle(
            owner=request.user,
            type=type,
            brand=brand,
            model=model,
            plate_number=plate_number,
            capacity_kg=capacity_kg,
            insurance_expiry=insurance_expiry,
            inspection_expiry=inspection_expiry,
            description=description,
            photo=photo,
        )
        vehicle.full_clean()
        vehicle.save()
        
        return JsonResponse({
            'message': 'Véhicule créé avec succès.',
            'vehicle': vehicle.as_dict()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_vehicles(request):
    """
    Récupérer la liste des véhicules
    - Transporteur: voit seulement ses véhicules (même s'il n'est pas encore approuvé)
    - Admin: voit tous les véhicules
    """
    user = request.user
    
    if user.role in ['ADMIN', 'DATA ADMIN']:
        vehicles = Vehicle.objects.all()
    elif user.role == 'TRANSPORTEUR':
        vehicles = Vehicle.objects.filter(owner=user)
    else:
        return JsonResponse({'error': 'Rôle non autorisé.'}, status=403)
    
    vehicles = vehicles.order_by('-created_at')
    
    return JsonResponse({
        'message': 'Liste des véhicules récupérée avec succès.',
        'vehicles': [v.as_dict() for v in vehicles]
    }, status=200)


@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_vehicle_detail(request, vehicle_slug):
    """
    Récupérer les détails d'un véhicule
    """
    try:
        vehicle = Vehicle.objects.get(slug=vehicle_slug)
    except Vehicle.DoesNotExist:
        return JsonResponse({'error': 'Véhicule non trouvé.'}, status=404)
    
    user = request.user
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if vehicle.owner != user:
            return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    # Inclure les documents
    data = vehicle.as_dict(include_related=True)
    data['documents'] = [doc.as_dict() for doc in vehicle.documents.all()]
    
    return JsonResponse({
        'message': 'Détails du véhicule récupérés avec succès.',
        'vehicle': data
    }, status=200)


@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def update_vehicle(request, vehicle_slug):
    """
    Modifier un véhicule
    Seul le propriétaire ou un admin peut modifier
    """
    try:
        vehicle = Vehicle.objects.get(slug=vehicle_slug)
    except Vehicle.DoesNotExist:
        return JsonResponse({'error': 'Véhicule non trouvé.'}, status=404)
    
    user = request.user
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if vehicle.owner != user:
            return JsonResponse({'error': 'Vous ne pouvez modifier que vos propres véhicules.'}, status=403)
    
    data = json.loads(request.body)
    
    # Champs modifiables
    if 'type' in data and data['type']:
        vehicle.type = data['type']
    if 'brand' in data and data['brand']:
        vehicle.brand = data['brand']
    if 'model' in data and data['model']:
        vehicle.model = data['model']
    if 'plate_number' in data and data['plate_number']:
        # Vérifier si le nouveau numéro existe déjà
        if Vehicle.objects.filter(plate_number=data['plate_number']).exclude(slug=vehicle_slug).exists():
            return JsonResponse({'error': 'Un véhicule avec ce numéro de plaque existe déjà.'}, status=400)
        vehicle.plate_number = data['plate_number']
    if 'capacity_kg' in data and data['capacity_kg'] is not None:
        vehicle.capacity_kg = data['capacity_kg']
    if 'insurance_expiry' in data:
        vehicle.insurance_expiry = data['insurance_expiry'] if data['insurance_expiry'] else None
    if 'inspection_expiry' in data:
        vehicle.inspection_expiry = data['inspection_expiry'] if data['inspection_expiry'] else None
    if 'description' in data:
        vehicle.description = data['description'] if data['description'] else None
    if 'status' in data and data['status']:
        vehicle.status = data['status']
    
    # Traitement de la photo
    photo_data = data.get('photo')
    ext = data.get('ext', 'jpg')
    if photo_data:
        try:
            if photo_data.startswith("data:image"):
                format, imgstr = photo_data.split(";base64,")
                vehicle.photo = ContentFile(base64.b64decode(imgstr), name=f"vehicle-{vehicle.plate_number}.{ext}")
            else:
                vehicle.photo = ContentFile(base64.b64decode(photo_data), name=f"vehicle-{vehicle.plate_number}.{ext}")
        except Exception as e:
            return JsonResponse({'error': f'Erreur lors du traitement de la photo: {str(e)}'}, status=400)
    
    try:
        vehicle.full_clean()
        vehicle.save()
        
        return JsonResponse({
            'message': 'Véhicule modifié avec succès.',
            'vehicle': vehicle.as_dict()
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
@is_logged_in
def delete_vehicle(request, vehicle_slug):
    """
    Supprimer (soft delete) un véhicule
    """
    try:
        vehicle = Vehicle.objects.get(slug=vehicle_slug)
    except Vehicle.DoesNotExist:
        return JsonResponse({'error': 'Véhicule non trouvé.'}, status=404)
    
    user = request.user
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if vehicle.owner != user:
            return JsonResponse({'error': 'Vous ne pouvez supprimer que vos propres véhicules.'}, status=403)
    
    vehicle.delete()  # Soft delete
    
    return JsonResponse({
        'message': 'Véhicule supprimé avec succès.'
    }, status=200)


# ==================== GESTION DES DOCUMENTS VÉHICULES ====================

@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def add_vehicle_document(request, vehicle_slug):
    """
    Ajouter un document à un véhicule
    """
    try:
        vehicle = Vehicle.objects.get(slug=vehicle_slug)
    except Vehicle.DoesNotExist:
        return JsonResponse({'error': 'Véhicule non trouvé.'}, status=404)
    
    user = request.user
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if vehicle.owner != user:
            return JsonResponse({'error': 'Vous ne pouvez ajouter des documents qu\'à vos propres véhicules.'}, status=403)
    
    # Utilisation de request.FILES et request.POST pour form-data
    file_obj = request.FILES.get("file", None)
    document_type = request.POST.get("document_type", None)
    name = request.POST.get("name", "")
    description = request.POST.get("description", None)
    expiry_date = request.POST.get("expiry_date", None)
    ext = request.POST.get("ext", None)
    
    # Si pas de fichier dans FILES, essayer dans le body JSON
    if not file_obj:
        try:
            data = json.loads(request.body)
            file_data = data.get("file")
            document_type = document_type or data.get("document_type")
            name = name or data.get("name", "")
            description = description or data.get("description")
            expiry_date = expiry_date or data.get("expiry_date")
            ext = ext or data.get("ext", "pdf")
            
            if file_data:
                if file_data.startswith("data:"):
                    format, file_str = file_data.split(";base64,")
                    now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
                    file_obj = ContentFile(
                        base64.b64decode(file_str),
                        name=f"vehicle-doc-{vehicle.slug}-{now_str}.{ext}"
                    )
                else:
                    now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
                    file_obj = ContentFile(
                        base64.b64decode(file_data),
                        name=f"vehicle-doc-{vehicle.slug}-{now_str}.{ext}"
                    )
        except:
            pass
    
    if not file_obj or not document_type:
        return JsonResponse({
            'error': "Le document et son type sont tous deux obligatoires"
        }, status=400)
    
    # Déterminer l'extension si non fournie
    if not ext and hasattr(file_obj, "content_type"):
        ext = mimetypes.guess_extension(file_obj.content_type) or "dat"
        ext = ext.lstrip(".")
    elif not ext:
        ext = "dat"
    
    # Renommer le fichier pour le stockage
    if not hasattr(file_obj, 'name') or not file_obj.name:
        now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
        file_obj.name = f"vehicle-doc-{vehicle.slug}-{now_str}.{ext}"
    
    try:
        doc = VehicleDocument(
            vehicle=vehicle,
            document_type=document_type,
            file=file_obj,
            name=name,
            description=description,
            expiry_date=expiry_date
        )
        doc.save()
        return JsonResponse({
            "message": "Document ajouté avec succès",
            "document": doc.as_dict()
        }, status=201)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["PATCH"])
@is_logged_in
def update_vehicle_document(request, doc_slug):
    """
    Modifier un document de véhicule
    """
    try:
        document = VehicleDocument.objects.get(slug=doc_slug)
    except VehicleDocument.DoesNotExist:
        return JsonResponse({'error': 'Document non trouvé.'}, status=404)
    
    user = request.user
    vehicle = document.vehicle
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if vehicle.owner != user:
            return JsonResponse({'error': 'Vous ne pouvez modifier que les documents de vos propres véhicules.'}, status=403)
    
    # Utilisation de request.FILES et request.POST pour form-data
    try:
        data = json.loads(request.body)
        document_type = data.get("document_type", None)
        name = data.get("name", None)
        description = data.get("description", None)
        expiry_date = data.get("expiry_date", None)
        file_data = data.get("file", None)
        ext = data.get("ext", None)
    except:
        document_type = request.POST.get("document_type", None)
        name = request.POST.get("name", None)
        description = request.POST.get("description", None)
        expiry_date = request.POST.get("expiry_date", None)
        file_data = None
        ext = None
    
    file_obj = request.FILES.get("file", None)
    
    # Si fichier dans le body JSON
    if not file_obj and file_data:
        if file_data.startswith("data:"):
            format, file_str = file_data.split(";base64,")
            now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
            file_obj = ContentFile(
                base64.b64decode(file_str),
                name=f"vehicle-doc-{vehicle.slug}-{now_str}.{ext or 'pdf'}"
            )
        else:
            now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
            file_obj = ContentFile(
                base64.b64decode(file_data),
                name=f"vehicle-doc-{vehicle.slug}-{now_str}.{ext or 'pdf'}"
            )
    
    # Déterminer l'extension si non fournie
    if file_obj and not ext:
        if hasattr(file_obj, "content_type"):
            ext = mimetypes.guess_extension(file_obj.content_type) or "dat"
            ext = ext.lstrip(".")
        else:
            ext = document.file.name.split('.')[-1] if document.file else "dat"
    
    # Renommer le fichier pour le stockage
    if file_obj:
        now_str = datetime.now().strftime("%Y%m%d%H%M%S%f")[:18]
        file_obj.name = f"vehicle-doc-{vehicle.slug}-{now_str}.{ext}"
    
    try:
        if file_obj:
            document.file = file_obj
        if document_type:
            document.document_type = document_type
        if name is not None:
            document.name = name
        if description is not None:
            document.description = description
        if expiry_date is not None:
            document.expiry_date = expiry_date
        document.save()
        return JsonResponse({
            "message": "Document modifié avec succès",
            "document": document.as_dict()
        }, status=200)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
@is_logged_in
def delete_vehicle_document(request, doc_slug):
    """
    Supprimer un document de véhicule
    """
    try:
        document = VehicleDocument.objects.get(slug=doc_slug)
    except VehicleDocument.DoesNotExist:
        return JsonResponse({'error': 'Document non trouvé.'}, status=404)
    
    user = request.user
    vehicle = document.vehicle
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if vehicle.owner != user:
            return JsonResponse({'error': 'Vous ne pouvez supprimer que les documents de vos propres véhicules.'}, status=403)
    
    document.delete()
    
    return JsonResponse({
        "message": "Document supprimé avec succès"
    }, status=200)


@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_vehicle_documents(request, vehicle_slug):
    """
    Récupérer tous les documents d'un véhicule
    """
    try:
        vehicle = Vehicle.objects.get(slug=vehicle_slug)
    except Vehicle.DoesNotExist:
        return JsonResponse({'error': 'Véhicule non trouvé.'}, status=404)
    
    user = request.user
    
    # Vérification des permissions
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        if vehicle.owner != user:
            return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    documents = vehicle.documents.all().order_by('-created_at')
    
    return JsonResponse({
        'message': 'Documents récupérés avec succès.',
        'documents': [doc.as_dict() for doc in documents]
    }, status=200)


# ==================== VALIDATION TRANSPORTEURS ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_pending_transporters(request):
    """
    Récupérer la liste des transporteurs en attente d'approbation
    """
    user = request.user
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    transporters = User.objects.filter(role__iexact='TRANSPORTEUR', is_approved=False).order_by('-created_at')
    
    return JsonResponse({
        'message': 'Liste des transporteurs en attente récupérée avec succès.',
        'transporters': [t.as_dict() for t in transporters]
    }, status=200)


@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def approve_transporter(request, transporter_slug):
    """
    Approuver un transporteur
    """
    user = request.user
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    try:
        transporter = User.objects.get(slug=transporter_slug, role='TRANSPORTEUR')
    except User.DoesNotExist:
        return JsonResponse({'error': 'Transporteur non trouvé.'}, status=404)
    
    if transporter.is_approved:
        return JsonResponse({'message': 'Ce transporteur est déjà approuvé.'}, status=200)
    
    transporter.is_approved = True
    transporter.approved_by = user
    transporter.approved_at = timezone.now()
    transporter.save()
    
    # Envoyer un email de confirmation
    try:
        send_transporter_approval_mail(transporter)
    except Exception as e:
        # On log l'erreur mais on ne bloque pas le processus
        print(f"Erreur envoi mail approbation: {str(e)}")
    
    return JsonResponse({
        'message': 'Transporteur approuvé avec succès.',
        'transporter': transporter.as_dict()
    }, status=200)


@csrf_exempt
@require_http_methods(["POST"])
@is_logged_in
def reject_transporter(request, transporter_slug):
    """
    Rejeter un transporteur (demande d'informations complémentaires)
    """
    user = request.user
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    try:
        transporter = User.objects.get(slug=transporter_slug, role='TRANSPORTEUR')
    except User.DoesNotExist:
        return JsonResponse({'error': 'Transporteur non trouvé.'}, status=404)
    
    try:
        data = json.loads(request.body)
        reason = data.get('reason')
    except:
        reason = None
    
    # Envoyer un email de rejet avec la raison
    try:
        send_transporter_rejection_mail(transporter, reason)
    except Exception as e:
        print(f"Erreur envoi mail rejet: {str(e)}")
        return JsonResponse({'error': "Erreur lors de l'envoi de l'email de rejet."}, status=500)
    
    return JsonResponse({
        'message': 'Transporteur informé du rejet de sa demande.'
    }, status=200)


@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_transporter_details(request, transporter_slug):
    """
    Récupérer les détails d'un transporteur (pour validation admin)
    """
    user = request.user
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    try:
        transporter = User.objects.get(slug=transporter_slug, role='TRANSPORTEUR')
    except User.DoesNotExist:
        return JsonResponse({'error': 'Transporteur non trouvé.'}, status=404)
    
    # Récupérer les documents légaux du transporteur
    legal_documents = DocumentLegal.objects.filter(user=transporter)
    
    # Récupérer les véhicules du transporteur
    vehicles = Vehicle.objects.filter(owner=transporter)
    
    data = transporter.as_dict()
    data['legal_documents'] = [doc.as_dict() for doc in legal_documents]
    data['vehicles'] = [v.as_dict() for v in vehicles]
    
    return JsonResponse({
        'message': 'Détails du transporteur récupérés avec succès.',
        'transporter': data
    }, status=200)


# ==================== GESTION FINANCIÈRE ADMIN ====================

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_all_wallets_by_admin(request):
    """
    Récupérer tous les portefeuilles
    """
    user = request.user
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    wallets = Wallet.objects.all().order_by('-balance')
    
    return JsonResponse({
        'message': 'Liste des portefeuilles récupérée avec succès.',
        'wallets': [w.as_dict(include_related=True) for w in wallets]
    }, status=200)

@csrf_exempt
@require_http_methods(["GET"])
@is_logged_in
def get_all_transactions_by_admin(request):
    """
    Récupérer toutes les transactions
    """
    user = request.user
    if user.role.upper() not in ['ADMIN', 'DATA ADMIN']:
        return JsonResponse({'error': 'Accès non autorisé.'}, status=403)
    
    limit = int(request.GET.get('limit', 100))
    txs = WalletTransaction.objects.all().order_by('-created_at')[:limit]
    
    return JsonResponse({
        'message': 'Liste des transactions récupérée avec succès.',
        'transactions': [tx.as_dict(include_related=True) for tx in txs]
    }, status=200)

